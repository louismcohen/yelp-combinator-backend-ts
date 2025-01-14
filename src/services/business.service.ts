import { BusinessModel } from '../models/Business';
import { yelpAPIService } from './yelpAPI.service';
import type { Business } from '../types/schemas';
import { createEmbeddingForBusiness } from './embedding.service';

export const businessService = {
  async getAll() {
    return BusinessModel.find().select('-yelpData.hours').lean();
  },

  async getUpdates(lastSync: Date) {
    return BusinessModel.find({
      lastUpdated: { $gt: lastSync },
    }).lean();
  },

  async upsertBusiness(businessData: Partial<Business>) {
    const yelpDataResponse = await yelpAPIService.getBusinessDetails(
      businessData.alias!,
    );

    const yelpData: Business['yelpData'] = yelpDataResponse.data;

    const business = {
      ...businessData,
      geoPoint: {
        type: 'Point' as const,
        coordinates: [
          yelpData?.coordinates.longitude,
          yelpData?.coordinates.latitude,
        ],
      },
      lastUpdated: new Date(),
    };

    const embedding = await createEmbeddingForBusiness(business);

    const result = BusinessModel.findOneAndUpdate(
      { alias: businessData.alias },
      {
        ...business,
        embedding,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
    console.log(`Upserted business ${businessData.alias}`);
    return result;
  },

  async bulkUpsertBusinesses(businesses: Partial<Business>[]) {
    const operations = businesses.map((business) => ({
      updateOne: {
        filter: { alias: business.alias },
        update: { $set: business },
        upsert: true,
      },
    }));

    return BusinessModel.bulkWrite(operations);
  },
};
