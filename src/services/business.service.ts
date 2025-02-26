import { BusinessModel } from '../models/Business';
import { yelpAPIService } from './yelpAPI.service';
import type { Business } from '../types/schemas';
import { createEmbeddingForBusiness } from './embedding.service';
import { embeddingLimiter } from '../utils/rateLimiter';
import { isEqual, omit } from 'lodash';
import diff from 'deep-diff';
import { BusinessSchema } from '../types/schemas';

type PartialBusiness = Partial<Business> & Pick<Business, 'alias'>;

const YelpDataSchema = BusinessSchema.shape.yelpData;

const extractYelpData = (business: PartialBusiness) => {
  const result = YelpDataSchema.parse(business.yelpData);
  return result;
};

export const businessService = {
  async getAll() {
    return await BusinessModel.find().select('-yelpData.hours').lean();
  },

  async getById(id: string) {
    return await BusinessModel.findById(id).lean();
  },

  async getByIds(idArray: string[]) {
    return await BusinessModel.find({ _id: { $in: idArray } }).lean();
  },

  async getUpdates(lastSync: Date) {
    return BusinessModel.find({
      lastUpdated: { $gt: lastSync },
    }).lean();
  },

  async upsertBusiness(
    businessData: PartialBusiness,
    generateEmbedding = false,
    updateYelpData = false,
  ): Promise<{ business: Business; updated: boolean }> {
    const existingBusiness = await BusinessModel.findOne({
      alias: businessData.alias,
    }).lean();

    const yelpDataResponse =
      (updateYelpData || !existingBusiness) &&
      (await yelpAPIService.getBusinessDetails(businessData.alias!));

    const yelpData: Business['yelpData'] = yelpDataResponse
      ? yelpDataResponse.data
      : (businessData.yelpData ?? {});

    const business: PartialBusiness = {
      ...businessData,
      yelpData,
      geoPoint: {
        type: 'Point' as const,
        coordinates: [
          yelpData?.coordinates?.longitude ?? 0,
          yelpData?.coordinates?.latitude ?? 0,
        ],
      },
      lastUpdated: new Date(),
    };

    const existingBusinessToCompare = existingBusiness && {
      note: existingBusiness.note,
      yelpData: existingBusiness.yelpData,
    };

    const businessToCompare = business && {
      note: business.note,
      yelpData: updateYelpData && omit(extractYelpData(business), ['photos']),
    };

    console.log(existingBusinessToCompare, businessToCompare);

    if (
      existingBusiness &&
      isEqual(existingBusinessToCompare, businessToCompare)
    ) {
      console.log(`${business.alias} has no updates`);
      return { business: existingBusiness, updated: false };
    }

    console.log({
      existing: existingBusinessToCompare,
      new: businessToCompare,
      diff: diff(existingBusinessToCompare, businessToCompare),
    });

    console.log(`${business.alias} has updates`);

    const embedding =
      generateEmbedding && (await createEmbeddingForBusiness(business));

    const result = await BusinessModel.findOneAndUpdate(
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

    return { business: result, updated: true };
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

  async updateEmbeddings(businessAliases?: string[]) {
    const businesses =
      businessAliases && businessAliases.length > 0
        ? await BusinessModel.find({ alias: { $in: businessAliases } }).lean()
        : await BusinessModel.find().lean();

    const operations = await Promise.all(
      businesses.map(async (business, index) => {
        return await embeddingLimiter.schedule(async () => {
          const embedding = await createEmbeddingForBusiness(business);
          console.log(
            `Updating document for business ${index + 1} of ${businesses.length}: ${business.alias}`,
          );
          return {
            updateOne: {
              filter: { alias: business.alias },
              update: { $set: { embedding } },
            },
          };
        });
      }),
    );

    return BusinessModel.bulkWrite(operations);
  },

  async getUniqueCategories() {
    const uniqueCategories = await BusinessModel.aggregate([
      {
        $unwind: '$categories', // Unwind the 'categories' array to process each item individually
      },
      {
        $group: {
          _id: '$categories.alias', // Group by 'alias' to get unique values
          title: { $first: '$categories.title' }, // Optionally include the title for each alias
        },
      },
      {
        $project: {
          alias: '$_id', // Rename '_id' to 'alias'
          _id: 0, // Exclude the default '_id' field
          title: 1,
        },
      },
    ]);

    return uniqueCategories;
  },
};
