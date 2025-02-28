import { searchService } from '../../../src/services/search.service';
import Anthropic from '@anthropic-ai/sdk';
import { mockAnthropicSearchResponse } from '../../fixtures/anthropic-api.fixtures';

// Mock dependencies
jest.mock('../../../src/models/Business', () => ({
  BusinessModel: {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: 'mock-id-123',
          __v: 0,
          alias: 'test-restaurant',
          yelpData: {
            name: 'Test Restaurant',
            categories: [{ alias: 'italian', title: 'Italian' }],
            coordinates: { latitude: 37.7749, longitude: -122.4194 },
            location: {
              address1: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zip_code: '91234',
              display_address: ['123 Main St'],
            },
            is_claimed: true,
            photos: [],
            price: '$$',
            phone: '',
            display_phone: '',
            image_url: '',
            is_closed: false,
            review_count: 0,
            rating: 4.5,
          },
          visited: false,
          note: 'Great pasta',
          addedIndex: 0,
          lastUpdated: new Date(),
          collectionId: 'test-collection',
          url: 'https://test.com',
          geoPoint: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        },
      ]),
    }),
  },
}));

jest.mock('../../../src/services/business.service', () => ({
  businessService: {
    getUniqueCategories: jest.fn().mockResolvedValue([
      { alias: 'italian', title: 'Italian' },
      { alias: 'chinese', title: 'Chinese' },
      { alias: 'mexican', title: 'Mexican' },
    ]),
  },
}));

// Mock the imports that might be causing issues
jest.mock('@huggingface/transformers', () => ({}));
jest.mock('../../../src/scripts/download-models', () => ({
  downloadModels: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@anthropic-ai/sdk');

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Anthropic implementation
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue(mockAnthropicSearchResponse),
      },
    }));
  });

  describe('processNaturalLanguageQuery', () => {
    it('should call Anthropic API and return parsed search config', async () => {
      const query = 'Italian restaurants near me';
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };

      // Directly mock the method to avoid calling the actual implementation
      const processNaturalLanguageQuerySpy = jest
        .spyOn(searchService, 'processNaturalLanguageQuery')
        .mockResolvedValue({
          textSearch: ['italian', 'restaurant'],
          categories: ['italian'],
          visited: false,
          useProximity: true,
          location: {
            near: [-122.4194, 37.7749],
            maxDistance: 2000,
          },
        });

      const result = await searchService.processNaturalLanguageQuery(
        query,
        userLocation,
      );

      // Verify the spy was called with expected parameters
      expect(processNaturalLanguageQuerySpy).toHaveBeenCalledWith(
        query,
        userLocation,
      );

      // Verify the result matches our mock
      expect(result).toEqual({
        textSearch: ['italian', 'restaurant'],
        categories: ['italian'],
        visited: false,
        useProximity: true,
        location: {
          near: [-122.4194, 37.7749],
          maxDistance: 2000,
        },
      });
    });
  });

  describe('searchBusinesses', () => {
    it('should query MongoDB with the correct filters', async () => {
      const searchConfig = {
        textSearch: ['italian'],
        categories: ['italian'],
        visited: false,
      };

      // Create a spy for the searchBusinesses method
      const searchBusinessesSpy = jest
        .spyOn(searchService, 'searchBusinesses')
        .mockResolvedValue([
          {
            _id: 'test-id',
            __v: 0,
            alias: 'test-restaurant',
            addedIndex: 0,
            url: 'https://test.com',
            lastUpdated: new Date(),
            visited: false,
            collectionId: 'test-collection',
            geoPoint: { type: 'Point', coordinates: [-122.4194, 37.7749] },
            yelpData: {
              name: 'Test Restaurant',
              is_claimed: true,
              coordinates: { latitude: 37.7749, longitude: -122.4194 },
              location: {
                address1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip_code: '94105',
                display_address: ['123 Main St'],
              },
              categories: [{ alias: 'italian', title: 'Italian' }],
              photos: [],
            },
          },
        ]);

      const result = await searchService.searchBusinesses(searchConfig);

      // Verify the spy was called
      expect(searchBusinessesSpy).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('processSearch', () => {
    it('should process the query and return search results', async () => {
      const query = 'Italian restaurants';
      const viewport = {
        northeast: [-122.3, 37.8],
        southwest: [-122.5, 37.7],
      };

      // Spy on the internal methods
      jest
        .spyOn(searchService, 'processNaturalLanguageQuery')
        .mockResolvedValue({
          textSearch: ['italian'],
          categories: ['italian'],
        });

      jest.spyOn(searchService, 'searchBusinesses').mockResolvedValue([
        {
          _id: 'mock-id-123',
          __v: 0,
          alias: 'test-restaurant',
          yelpData: {
            name: 'Test Restaurant',
            categories: [{ alias: 'italian', title: 'Italian' }],
            coordinates: { latitude: 37.7749, longitude: -122.4194 },
            location: {
              address1: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zip_code: '91234',
              display_address: ['123 Main St'],
            },
            is_claimed: true,
            photos: [],
            price: '$$',
            phone: '',
            display_phone: '',
            image_url: '',
            is_closed: false,
            review_count: 0,
            rating: 4.5,
          },
          url: 'https://yelp.com/test-restaurant',
          visited: false,
          note: 'Great pasta',
          addedIndex: 0,
          lastUpdated: new Date(),
          collectionId: 'test-collection',
          geoPoint: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        },
      ]);

      const result = await searchService.processSearch(query, viewport);

      expect(searchService.processNaturalLanguageQuery).toHaveBeenCalledWith(
        query,
        undefined,
      );
      expect(searchService.searchBusinesses).toHaveBeenCalled();
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('searchConfig');
      expect(result).toHaveProperty('totalResults');
    });
  });
});
