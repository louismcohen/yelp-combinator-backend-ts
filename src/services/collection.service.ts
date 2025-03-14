// services/collection.service.ts
import { CollectionModel } from '../models/Collection';
import { scraperService } from './scraper.service';
import { businessService } from './business.service';
import { createError } from '../utils/asyncHandler';
import type { Business, Collection } from '../types/schemas';
import { BusinessModel } from '../models/Business';

export const collectionService = {
  async checkForUpdates(collectionIds?: string[]) {
    const updateResults = [];

    let yelpCollectionIds: string[] = [];
    if (!collectionIds) {
      yelpCollectionIds = await CollectionModel.distinct('yelpCollectionId');
    } else {
      yelpCollectionIds = collectionIds;
    }

    console.log(
      `Checking for updates for ${yelpCollectionIds?.length} collections:`,
      yelpCollectionIds,
    );

    for (const collectionId of yelpCollectionIds) {
      const existingCollection = await CollectionModel.findOne({
        yelpCollectionId: collectionId,
      });

      const scrapedResult = await scraperService.scrapeCollection(collectionId);

      if (!scrapedResult.success) {
        console.log(
          `Error scraping collection ${collectionId}:`,
          scrapedResult.error,
        );
        updateResults.push({
          collectionId,
          needsUpdate: false,
          error: scrapedResult.error,
        });
        continue;
      }

      const needsUpdate =
        !existingCollection ||
        scrapedResult.data.lastUpdated > existingCollection.lastUpdated;

      console.log(
        `Collection ${collectionId} scraped successfully. Needs update: ${needsUpdate ? 'YES' : 'NO'}`,
      );
      updateResults.push({
        collectionId,
        needsUpdate,
        existing: existingCollection?.lastUpdated,
        scraped: scrapedResult.data.lastUpdated,
      });
    }

    return updateResults;
  },

  async syncCollection(
    collectionId: string,
    generateEmbeddings?: boolean,
    updateYelpData?: boolean,
  ) {
    const scrapeResult =
      await scraperService.scrapeFullCollection(collectionId);

    if (!scrapeResult.success) {
      throw createError(
        400,
        `Failed to scrape collection: ${scrapeResult.error}`,
      );
    }

    const scrapedCollection = scrapeResult.data;

    let businessesUpdated = 0;
    const updatedBusinesses: Business[] = [];

    // If there are items, process them first
    if (scrapedCollection.items && scrapedCollection.items.length > 0) {
      const businessPromises = scrapedCollection.items.map(async (business) => {
        try {
          const { business: upsertedBusiness, updated } =
            await businessService.upsertBusiness(
              {
                ...business,
                collectionId: scrapedCollection.yelpCollectionId,
              },
              generateEmbeddings,
              updateYelpData,
            );

          if (updated && upsertedBusiness) {
            updatedBusinesses.push(upsertedBusiness);
            businessesUpdated++;
          }

          return upsertedBusiness;
        } catch (error) {
          console.error(`Failed to upsert business ${business.alias}:`, error);
          return null;
        }
      });

      const businesses = (await Promise.all(businessPromises)).filter(
        (b): b is NonNullable<typeof b> => b !== null,
      );

      // Delete businesses that are no longer in the scraped collection
      const businessIdsInCollection = businesses.map((b) => b._id);
      const deletedBusinesses = await BusinessModel.deleteMany({
        _id: { $nin: businessIdsInCollection },
        collectionId: scrapedCollection.yelpCollectionId,
      });

      if (deletedBusinesses.deletedCount > 0)
        console.log(`Deleted ${deletedBusinesses.deletedCount} businesses`);

      // Update or create collection with business references
      const collection = await CollectionModel.findOneAndUpdate(
        { yelpCollectionId: collectionId },
        {
          ...scrapedCollection,
          businesses: businessIdsInCollection,
        },
        {
          new: true,
          upsert: true,
        },
      );

      return {
        collection,
        businessesProcessed: businesses.length,
        businessesUpdated,
        updatedBusinesses,
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
      businessesUpdated,
      totalItems: scrapedCollection.itemCount,
    };
  },

  async syncCollections(
    collectionIds?: string[],
    generateEmbeddings?: boolean,
    updateYelpData?: boolean,
  ) {
    const results = [];

    let yelpCollectionIds: string[] = [];
    if (!collectionIds) {
      yelpCollectionIds = await CollectionModel.distinct('yelpCollectionId');
    } else {
      yelpCollectionIds = collectionIds;
    }

    for (const collectionId of yelpCollectionIds) {
      try {
        const result = await this.syncCollection(
          collectionId,
          generateEmbeddings,
          updateYelpData,
        );
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

  async addAndSyncCollection(
    collectionId: string,
    generateEmbedding = false,
    updateYelpData = true,
  ) {
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
    const businessPromises = businessesResult.data.map(
      async (business, index) => {
        try {
          const upserted = await businessService.upsertBusiness(
            {
              ...business,
              collectionId: scrapeResult.data.yelpCollectionId,
            },
            generateEmbedding,
            updateYelpData,
          );

          console.log(
            `Inserted business ${index + 1} of ${businessesResult.data.length}: ${upserted.business.alias}. Embeddings generated: ${generateEmbedding}`,
          );

          return upserted;
        } catch (error) {
          console.error(`Failed to upsert business ${business.alias}:`, error);
          return null;
        }
      },
    );

    const businessesPromisesResults = (
      await Promise.all(businessPromises)
    ).filter((b): b is NonNullable<typeof b> => b !== null);

    // Create collection with business references
    const collection = await CollectionModel.create({
      ...scrapeResult.data,
      businesses: businessesPromisesResults.map((r) => r.business._id),
    });

    return {
      collection,
      businessesProcessed: businessesPromisesResults.length,
      totalItems: scrapeResult.data.itemCount,
    };
  },

  async checkAndSyncUpdates(
    collectionIds?: string[],
    generateEmbeddings?: boolean,
    updateYelpData?: boolean,
  ) {
    const updateResults = await this.checkForUpdates(collectionIds);
    const collectionsToUpdate = updateResults
      .filter((result) => result.needsUpdate)
      .map((result) => result.collectionId);

    if (collectionsToUpdate.length > 0) {
      const syncResults = await this.syncCollections(
        collectionsToUpdate,
        generateEmbeddings,
        updateYelpData,
      );
      return syncResults;
    }

    return [];
  },
};
