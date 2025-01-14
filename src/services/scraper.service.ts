// services/scraper.service.ts
import * as cheerio from 'cheerio';
import axios from 'axios';
import { yelpConfig } from '../config/yelp';
import type {
  ScrapedBusiness,
  ScrapedCollection,
  ScrapeResult,
} from '../types/scraper.types';

export const scraperService = {
  async scrapeCollection(
    collectionId: string,
  ): Promise<ScrapeResult<ScrapedCollection>> {
    try {
      const response = await axios.get(
        `${yelpConfig.collectionUrl}${collectionId}`,
        {
          headers: {
            Accept: 'text/html',
            'User-Agent': 'Mozilla/5.0 (compatible; YelpCollectionBot/1.0)',
          },
        },
      );

      const $ = cheerio.load(response.data);

      const collection: ScrapedCollection = {
        yelpCollectionId: collectionId,
        title: $('meta[property="og:title"]').attr('content') || '',
        itemCount: Number($('.ylist').attr('data-item-count')),
        lastUpdated: new Date($('time').attr('datetime') || ''),
        items: [],
      };

      if (!collection.itemCount || !collection.lastUpdated) {
        return {
          success: false,
          error: 'Failed to parse collection data',
        };
      }

      return { success: true, data: collection };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async scrapeCollectionBusinesses(
    collectionId: string,
    itemCount: number,
  ): Promise<ScrapeResult<ScrapedBusiness[]>> {
    try {
      const businesses: ScrapedBusiness[] = [];
      const offsetStep = 30;

      for (let offset = 0; offset < itemCount; offset += offsetStep) {
        const response = await axios.get(yelpConfig.renderedItemsUrl, {
          params: {
            collection_id: collectionId,
            offset,
            sort_by: 'date',
          },
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.data.list_markup) {
          return {
            success: false,
            error: 'Failed to get rendered items',
          };
        }

        const $ = cheerio.load(response.data.list_markup);

        $('.collection-item').each((index, element) => {
          const $element = $(element);
          try {
            const business = this.scrapeBusinessFromElement(
              $element,
              itemCount - offset - index - 1,
            );
            businesses.push(business);
          } catch (error) {
            console.error('Failed to parse business element:', error);
            // Continue with next element
          }
        });

        // if (offset + offsetStep < itemCount) {
        //   await new Promise((resolve) => setTimeout(resolve, 300));
        // }
        console.log(`Scraped ${businesses.length} of ${itemCount} businesses`);
      }

      return { success: true, data: businesses };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  scrapeBusinessFromElement(
    $element: cheerio.Cheerio,
    addedIndex: number,
  ): ScrapedBusiness {
    const encodedBizUrl = $element.find('.biz-name').attr('href') || '';
    const bizUrl = decodeURIComponent(encodedBizUrl);
    const bizAlias = decodeURIComponent(bizUrl.split('?')[0].slice(5));

    if (!bizAlias) {
      throw new Error('Failed to parse business data');
    }

    return {
      alias: bizAlias,
      note: $element.find('.js-info-content').text().trim(),
      addedIndex,
    };
  },

  async scrapeFullCollection(
    collectionId: string,
  ): Promise<ScrapeResult<ScrapedCollection>> {
    try {
      const collectionResult = await this.scrapeCollection(collectionId);
      if (!collectionResult.success) {
        return collectionResult;
      }

      const businessesResult = await this.scrapeCollectionBusinesses(
        collectionId,
        collectionResult.data.itemCount,
      );
      if (!businessesResult.success) {
        return businessesResult;
      }

      return {
        success: true,
        data: {
          ...collectionResult.data,
          items: businessesResult.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
