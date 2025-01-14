import { BusinessModel } from '../models/Business';
import { yelpAPIService } from './yelpAPI.service';
import type { Business } from '../types/schemas';

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

    const result = BusinessModel.findOneAndUpdate(
      { alias: businessData.alias },
      {
        ...businessData,
        geoPoint: {
          type: 'Point',
          coordinates: [
            yelpData?.coordinates.longitude,
            yelpData?.coordinates.latitude,
          ],
        },
        yelpData,
        lastUpdated: new Date(),
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
