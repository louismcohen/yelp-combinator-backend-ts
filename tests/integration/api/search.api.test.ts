import request from 'supertest';
import express from 'express';
import { searchService } from '../../../src/services/search.service';
import { searchRoutes } from '../../../src/routes/search.routes';
import { errorHandler } from '../../../src/middleware/error.middleware';

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/search', searchRoutes);
app.use(errorHandler);

// Mock the search service
jest.mock('../../../src/services/search.service', () => ({
  searchService: {
    processSearch: jest.fn(),
  },
}));

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /search', () => {
    it('should return search results for a valid request', async () => {
      const mockSearchResults = {
        results: [
          {
            alias: 'test-restaurant',
            yelpData: {
              name: 'Test Restaurant',
              categories: [{ alias: 'italian', title: 'Italian' }],
              coordinates: { latitude: 37.7749, longitude: -122.4194 },
            },
          },
        ],
        searchConfig: {
          textSearch: ['italian'],
          categories: ['italian'],
        },
        totalResults: 1,
      };

      // Mock the service function
      (searchService.processSearch as jest.Mock).mockResolvedValue(mockSearchResults);

      // Test the endpoint
      const response = await request(app)
        .post('/search')
        .send({
          query: 'Italian restaurants',
          viewport: {
            northeast: [-122.3, 37.8],
            southwest: [-122.5, 37.7],
          },
        });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSearchResults);
      expect(searchService.processSearch).toHaveBeenCalledWith(
        'Italian restaurants', 
        {
          northeast: [-122.3, 37.8],
          southwest: [-122.5, 37.7],
        }, 
        undefined
      );
    });

    it('should return 400 for invalid request', async () => {
      // Test with invalid request (missing required field)
      const response = await request(app)
        .post('/search')
        .send({
          // Missing query
          viewport: {
            northeast: [-122.3, 37.8],
            southwest: [-122.5, 37.7],
          },
        });

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});