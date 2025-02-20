import Anthropic from '@anthropic-ai/sdk';
import { BusinessModel } from '../models/Business';
import { businessService } from './business.service';
import { env } from '../config/env';
import {
  SearchConfigSchema,
  type SearchConfig,
  type Viewport,
} from '../types/search.schemas';
import { FilterQuery } from 'mongoose';
import { Business } from '../types/schemas';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const searchService = {
  async processSearch(
    query: string,
    viewport?: Viewport,
    userLocation?: { latitude: number; longitude: number },
  ) {
    const searchConfig = await this.processNaturalLanguageQuery(
      query,
      userLocation,
    );
    const results = await this.searchBusinesses(
      searchConfig,
      viewport,
      userLocation,
    );

    return {
      results,
      searchConfig,
      totalResults: results.length,
    };
  },

  async processNaturalLanguageQuery(
    query: string,
    userLocation?: { latitude: number; longitude: number },
  ): Promise<SearchConfig> {
    const uniqueCategories = await businessService.getUniqueCategories();

    const systemPrompt = `
    You are helping search a database of Yelp bookmarks. Return a search configuration object with these possible fields:
    {
      textSearch?: string[];     // For searching name, notes, and categories. A note might have information about certain menu items or cuisines at the restaurant, so if a term in the query isn't obviously a name or category, it should be a note. Separate each potential query into its own string. 
      categories?: string[];     // Specific category filters, namely the type of business it is (e.g. "coffee, bar") or cuisine it might have (e.g. "Italian", "Mexican", "Chinese", etc.). The query might be in the plural such as "bars", but the category is in the singular.
      visited?: boolean;         // Filter by visited status
      isClaimed?: boolean;       // Filter by claimed status
      shouldCheckHours?: boolean; // Indicates if results need to be filtered by open status
      useProximity?: boolean;    // True if query explicitly mentions location relative to user AND userLocation is provided
      location?: {
        near: [number, number],  // [longitude, latitude]
        maxDistance?: number     // In meters
      }
    }

    Note about text vs. categories: "Restaurant" itself is not a category should never be entered as a category. For example "thai restaurant" should yield "thai" as a category, and the word "restaurant" can be discarded.

    For the categories field, match the query with the following categories: ${uniqueCategories.map((category) => category.alias).join(', ')}.
    
    ${
      userLocation
        ? `Current user location: ${userLocation.latitude}, ${userLocation.longitude}`
        : 'No user location provided'
    }
    IMPORTANT: Only set useProximity to true if the query explicitly mentions location relative to the user 
    AND user location is provided (e.g., "near me", "within 2 miles", "nearby", "close to me", etc.).
    If no user location is provided, ignore any proximity-based requests.
    Return only a valid JSON object matching this schema.
  `;

    console.log(`Processing search query: ${query}`);
    console.log(`System prompt: ${systemPrompt}`);

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Convert this search request to a search configuration: "${query}"`,
        },
      ],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error(`Response returned unexpected format ${contentBlock}`);
    }

    return SearchConfigSchema.parse(JSON.parse(contentBlock.text));
  },

  async searchBusinesses(
    searchConfig: SearchConfig,
    viewport?: Viewport,
    userLocation?: { latitude: number; longitude: number },
  ) {
    const mongoQuery: FilterQuery<Business> = {};
    const andConditions: FilterQuery<Business>[] = [];

    console.log('searchConfig:', searchConfig);
    console.log('viewport:', viewport);

    // Text search across name and notes
    if (searchConfig.textSearch?.length) {
      mongoQuery.$or = [
        ...searchConfig.textSearch.map((text) => ({
          'yelpData.name': {
            $regex: text,
            $options: 'i',
          },
        })),
        ...searchConfig.textSearch.map((text) => ({
          note: {
            $regex: text,
            $options: 'i',
          },
        })),
      ];
    }

    // Category filtering
    if (searchConfig.categories?.length) {
      andConditions.push({
        $or: searchConfig.categories
          .filter((category) => category !== 'restaurant')
          .map((category) => ({
            'yelpData.categories.alias': {
              $regex: category,
              $options: 'i',
            },
          })),
      });
    }

    // Visited status
    if (typeof searchConfig.visited === 'boolean') {
      mongoQuery.visited = searchConfig.visited;
    }

    // Claimed status
    if (typeof searchConfig.isClaimed === 'boolean') {
      mongoQuery['yelpData.is_claimed'] = searchConfig.isClaimed;
    }

    // Location-based search
    if (userLocation && searchConfig.useProximity) {
      // Use user location if provided and proximity was requested
      mongoQuery['yelpData.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLocation.longitude, userLocation.latitude],
          },
          $maxDistance: searchConfig.location?.maxDistance || 2000,
        },
      };
    } else if (viewport) {
      // Fall back to viewport if no user location or proximity not requested
      mongoQuery['yelpData.coordinates.latitude'] = {
        $gte: viewport.southwest[1],
        $lte: viewport.northeast[1],
      };
      mongoQuery['yelpData.coordinates.longitude'] = {
        $gte: viewport.southwest[0],
        $lte: viewport.northeast[0],
      };
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      mongoQuery.$and = andConditions;
    }

    console.log('Mongo query:', JSON.stringify(mongoQuery, null, 2));

    // Execute query
    const results = await BusinessModel.find(mongoQuery)
      .select({
        'yelpData.name': 1,
        'yelpData.categories': 1,
        'yelpData.coordinates': 1,
        'yelpData.location': 1,
        'yelpData.is_claimed': 1,
        note: 1,
        visited: 1,
        url: 1,
        alias: 1,
      })
      .lean();

    return results;
  },
};
