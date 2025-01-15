// services/collection.service.ts
import { CollectionModel } from '../models/Collection';
import { scraperService } from './scraper.service';
import { businessService } from './business.service';
import { createError } from '../utils/asyncHandler';
import type { Collection } from '../types/schemas';

export const collectionService = {
  async checkForUpdates(collectionIds?: string[]) {
    const updateResults = [];

    let yelpCollectionIds: string[] = [];
    if (!collectionIds) {
      yelpCollectionIds = await CollectionModel.distinct('yelpCollectionId');
    } else {
      yelpCollectionIds = collectionIds;
    }

    for (const collectionId of yelpCollectionIds) {
      const existingCollection = await CollectionModel.findOne({
        yelpCollectionId: collectionId,
      });

      const scrapedResult = await scraperService.scrapeCollection(collectionId);

      if (!scrapedResult.success) {
        updateResults.push({
          collectionId,
          needsUpdate: false,
          error: scrapedResult.error,
        });
        continue;
      }

      updateResults.push({
        collectionId,
        needsUpdate:
          !existingCollection ||
          scrapedResult.data.lastUpdated > existingCollection.lastUpdated,
        existing: existingCollection?.lastUpdated,
        scraped: scrapedResult.data.lastUpdated,
      });
    }

    return updateResults;
  },

  async syncCollection(collectionId: string) {
    const scrapeResult =
      await scraperService.scrapeFullCollection(collectionId);

    if (!scrapeResult.success) {
      throw createError(
        400,
        `Failed to scrape collection: ${scrapeResult.error}`,
      );
    }

    const scrapedCollection = scrapeResult.data;

    // If there are items, process them first
    if (scrapedCollection.items && scrapedCollection.items.length > 0) {
      const businessPromises = scrapedCollection.items.map(async (business) => {
        try {
          return await businessService.upsertBusiness({
            ...business,
            collectionId: scrapedCollection.yelpCollectionId,
          });
        } catch (error) {
          console.error(`Failed to upsert business ${business.alias}:`, error);
          return null;
        }
      });

      const businesses = (await Promise.all(businessPromises)).filter(
        (b): b is NonNullable<typeof b> => b !== null,
      );

      // Update or create collection with business references
      const collection = await CollectionModel.findOneAndUpdate(
        { yelpCollectionId: collectionId },
        {
          ...scrapedCollection,
          businesses: businesses.map((b) => b._id),
        },
        {
          new: true,
          upsert: true,
        },
      );

      return {
        collection,
        businessesProcessed: businesses.length,
        totalItems: scrapedCollection.itemCount,
      };
    }

    // If no items, just update collection metadata
    const collection = await CollectionModel.findOneAndUpdate(
      { yelpCollectionId: collectionId },
      scrapedCollection,
      {
        new: true,
        upsert: true,
      },
    );

    return {
      collection,
      businessesProcessed: 0,
      totalItems: scrapedCollection.itemCount,
    };
  },

  async syncCollections(collectionIds?: string[]) {
    const results = [];

    let yelpCollectionIds: string[] = [];
    if (!collectionIds) {
      yelpCollectionIds = await CollectionModel.distinct('yelpCollectionId');
    } else {
      yelpCollectionIds = collectionIds;
    }

    for (const collectionId of yelpCollectionIds) {
      try {
        const result = await this.syncCollection(collectionId);
        results.push({
          collectionId,
          status: 'success',
          ...result,
        });
      } catch (error) {
        results.push({
          collectionId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },

  async getCollection(collectionId: string): Promise<Collection> {
    const collection = await CollectionModel.findOne({
      yelpCollectionId: collectionId,
    }).populate('businesses');

    if (!collection) {
      throw createError(404, `Collection ${collectionId} not found`);
    }

    return collection;
  },

  async getAllCollections(): Promise<Collection[]> {
    return CollectionModel.find().select('-businesses').lean();
  },

  async findByYelpId(yelpCollectionId: string) {
    return CollectionModel.findOne({ yelpCollectionId });
  },

  async addAndSyncCollection(collectionId: string) {
    // First scrape collection metadata
    const scrapeResult = await scraperService.scrapeCollection(collectionId);
    if (!scrapeResult.success) {
      throw createError(
        400,
        `Failed to scrape collection: ${scrapeResult.error}`,
      );
    }

    console.log(
      `Collection ${collectionId} successfully scraped.\nNow scraping ${scrapeResult.data.itemCount} businesses`,
    );

    // Then scrape all businesses
    const businessesResult = await scraperService.scrapeCollectionBusinesses(
      collectionId,
      scrapeResult.data.itemCount,
    );
    if (!businessesResult.success) {
      throw createError(
        400,
        `Failed to scrape businesses: ${businessesResult.error}`,
      );
    }

    console.log(
      `Successfully scraped ${businessesResult.data.length} businesses.`,
    );

    // Process and store businesses
    const businessPromises = businessesResult.data.map(async (business) => {
      try {
        return await businessService.upsertBusiness({
          ...business,
          collectionId: scrapeResult.data.yelpCollectionId,
        });
      } catch (error) {
        console.error(`Failed to upsert business ${business.alias}:`, error);
        return null;
      }
    });

    const businesses = (await Promise.all(businessPromises)).filter(
      (b): b is NonNullable<typeof b> => b !== null,
    );

    // Create collection with business references
    const collection = await CollectionModel.create({
      ...scrapeResult.data,
      businesses: businesses.map((b) => b._id),
    });

    return {
      collection,
      businessesProcessed: businesses.length,
      totalItems: scrapeResult.data.itemCount,
    };
  },
};
