import { businessService } from '../../../src/services/business.service';
import { BusinessModel } from '../../../src/models/Business';
import { yelpAPIService } from '../../../src/services/yelpAPI.service';
import { createEmbeddingForBusiness } from '../../../src/services/embedding.service';
import { embeddingLimiter } from '../../../src/utils/rateLimiter';

// Mock dependencies
jest.mock('../../../src/models/Business', () => ({
  BusinessModel: {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    bulkWrite: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
    aggregate: jest.fn().mockResolvedValue([
      { alias: 'italian', title: 'Italian' },
      { alias: 'mexican', title: 'Mexican' },
    ]),
    lean: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../src/services/yelpAPI.service', () => ({
  yelpAPIService: {
    getBusinessDetails: jest.fn().mockResolvedValue({
      data: {
        name: 'Test Business',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        location: {
          address1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          display_address: ['123 Main St'],
        },
        categories: [{ alias: 'italian', title: 'Italian' }],
        is_claimed: true,
        photos: [],
        price: '$$',
      },
    }),
  },
}));

jest.mock('../../../src/services/embedding.service', () => ({
  createEmbeddingForBusiness: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

jest.mock('../../../src/utils/rateLimiter', () => ({
  embeddingLimiter: {
    schedule: jest.fn((fn) => fn()),
  },
}));

describe('Business Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all businesses', async () => {
      const mockBusinesses = [
        {
          _id: 'mockId1',
          alias: 'business-1',
          name: 'Business 1',
        },
        {
          _id: 'mockId2',
          alias: 'business-2',
          name: 'Business 2',
        },
      ];

      (BusinessModel.find().lean as jest.Mock).mockResolvedValue(mockBusinesses);

      const result = await businessService.getAll();

      expect(BusinessModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockBusinesses);
      expect(result.length).toBe(2);
    });
  });

  describe('getById', () => {
    it('should find business by id', async () => {
      const mockBusiness = {
        _id: 'mockId',
        alias: 'test-business',
        name: 'Test Business',
      };

      (BusinessModel.findById().lean as jest.Mock).mockResolvedValue(mockBusiness);

      const result = await businessService.getById('mockId');

      expect(BusinessModel.findById).toHaveBeenCalledWith('mockId');
      expect(result).toEqual(mockBusiness);
    });
  });

  describe('getByIds', () => {
    it('should find businesses by multiple ids', async () => {
      const mockBusinesses = [
        {
          _id: 'mockId1',
          alias: 'business-1',
          name: 'Business 1',
        },
        {
          _id: 'mockId2',
          alias: 'business-2',
          name: 'Business 2',
        },
      ];

      (BusinessModel.find().lean as jest.Mock).mockResolvedValue(mockBusinesses);

      const result = await businessService.getByIds(['mockId1', 'mockId2']);

      expect(BusinessModel.find).toHaveBeenCalledWith({
        _id: { $in: ['mockId1', 'mockId2'] },
      });
      expect(result).toEqual(mockBusinesses);
      expect(result.length).toBe(2);
    });
  });

  describe('getUpdates', () => {
    it('should find businesses updated after a given date', async () => {
      const mockDate = new Date('2023-01-01');
      const mockBusinesses = [
        {
          _id: 'mockId1',
          alias: 'business-1',
          lastUpdated: new Date('2023-01-15'),
        },
      ];

      (BusinessModel.find().lean as jest.Mock).mockResolvedValue(mockBusinesses);

      const result = await businessService.getUpdates(mockDate);

      expect(BusinessModel.find).toHaveBeenCalledWith({
        lastUpdated: { $gt: mockDate },
      });
      expect(result).toEqual(mockBusinesses);
    });
  });

  describe('upsertBusiness', () => {
    it('should create a new business when it does not exist', async () => {
      const businessData = {
        alias: 'new-business',
        note: 'Great place',
        addedIndex: 1,
        collectionId: 'col123',
      };

      const mockNewBusiness = {
        ...businessData,
        yelpData: {
          name: 'Test Business',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
          location: {
            address1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94105',
            display_address: ['123 Main St'],
          },
          categories: [{ alias: 'italian', title: 'Italian' }],
          is_claimed: true,
          photos: [],
          price: '$$',
        },
        geoPoint: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        lastUpdated: expect.any(Date),
      };

      // Mock that findOne returns null (business doesn't exist)
      (BusinessModel.findOne().lean as jest.Mock).mockResolvedValue(null);

      // Mock successful business creation
      (BusinessModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockNewBusiness);

      const result = await businessService.upsertBusiness(businessData);

      expect(BusinessModel.findOne).toHaveBeenCalledWith({
        alias: 'new-business',
      });
      
      expect(yelpAPIService.getBusinessDetails).toHaveBeenCalledWith('new-business');
      
      expect(BusinessModel.findOneAndUpdate).toHaveBeenCalledWith(
        { alias: 'new-business' },
        expect.objectContaining({
          alias: 'new-business',
          note: 'Great place',
          geoPoint: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749],
          },
        }),
        expect.objectContaining({
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        })
      );

      expect(result.updated).toBe(true);
      expect(result.business).toEqual(mockNewBusiness);
    });

    it('should update an existing business with changes', async () => {
      const existingBusiness = {
        _id: 'existingId',
        alias: 'existing-business',
        note: 'Old note',
        visited: false,
        addedIndex: 1,
        collectionId: 'col123',
        yelpData: {
          name: 'Old Name',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
          location: {
            address1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94105',
            display_address: ['123 Main St'],
          },
          categories: [{ alias: 'italian', title: 'Italian' }],
          is_claimed: true,
        },
        geoPoint: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        lastUpdated: new Date('2023-01-01'),
      };

      const businessData = {
        alias: 'existing-business',
        note: 'Updated note',
        visited: true,
      };

      // Mock that findOne returns the existing business
      (BusinessModel.findOne().lean as jest.Mock).mockResolvedValue(existingBusiness);

      // Mock successful business update
      const updatedBusiness = {
        ...existingBusiness,
        ...businessData,
        lastUpdated: expect.any(Date),
      };
      (BusinessModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedBusiness);

      const result = await businessService.upsertBusiness(businessData, false, false);

      expect(BusinessModel.findOne).toHaveBeenCalledWith({
        alias: 'existing-business',
      });
      
      // When updateYelpData is false, shouldn't call getBusinessDetails
      expect(yelpAPIService.getBusinessDetails).not.toHaveBeenCalled();
      
      expect(result.updated).toBe(true);
      expect(result.business).toEqual(updatedBusiness);
    });
  });

  describe('getUniqueCategories', () => {
    it('should return unique categories from aggregation', async () => {
      const expectedCategories = [
        { alias: 'italian', title: 'Italian' },
        { alias: 'mexican', title: 'Mexican' },
      ];

      const result = await businessService.getUniqueCategories();

      expect(BusinessModel.aggregate).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toEqual(expectedCategories);
    });
  });

  describe('updateEmbeddings', () => {
    it('should update embeddings for all businesses', async () => {
      const mockBusinesses = [
        {
          _id: 'mockId1',
          alias: 'business-1',
          name: 'Business 1',
        },
        {
          _id: 'mockId2',
          alias: 'business-2',
          name: 'Business 2',
        },
      ];

      (BusinessModel.find().lean as jest.Mock).mockResolvedValue(mockBusinesses);
      
      const result = await businessService.updateEmbeddings();

      expect(BusinessModel.find().lean).toHaveBeenCalled();
      expect(createEmbeddingForBusiness).toHaveBeenCalledTimes(2);
      expect(embeddingLimiter.schedule).toHaveBeenCalledTimes(2);
      expect(BusinessModel.bulkWrite).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toEqual({ modifiedCount: 2 });
    });

    it('should update embeddings for specific businesses', async () => {
      const mockBusinesses = [
        {
          _id: 'mockId1',
          alias: 'business-1',
          name: 'Business 1',
        },
      ];

      (BusinessModel.find().lean as jest.Mock).mockResolvedValue(mockBusinesses);
      
      const result = await businessService.updateEmbeddings(['business-1']);

      expect(BusinessModel.find).toHaveBeenCalledWith({
        alias: { $in: ['business-1'] },
      });
      
      expect(createEmbeddingForBusiness).toHaveBeenCalledTimes(1);
      expect(embeddingLimiter.schedule).toHaveBeenCalledTimes(1);
      expect(BusinessModel.bulkWrite).toHaveBeenCalledWith(expect.any(Array));
      expect(result).toEqual({ modifiedCount: 2 });
    });
  });

  describe('bulkUpsertBusinesses', () => {
    it('should perform bulk write operation with provided businesses', async () => {
      const businesses = [
        {
          alias: 'business-1',
          note: 'Great food',
        },
        {
          alias: 'business-2',
          note: 'Excellent service',
        },
      ];

      const result = await businessService.bulkUpsertBusinesses(businesses);

      expect(BusinessModel.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { alias: 'business-1' },
            update: { $set: businesses[0] },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { alias: 'business-2' },
            update: { $set: businesses[1] },
            upsert: true,
          },
        },
      ]);

      expect(result).toEqual({ modifiedCount: 2 });
    });
  });
});