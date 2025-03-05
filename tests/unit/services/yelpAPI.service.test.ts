import axios from 'axios';
import { yelpAPIService } from '../../../src/services/yelpAPI.service';
import { createError } from '../../../src/utils/asyncHandler';

// Mock for axios.get
const mockGet = jest.fn();

// Mock all required dependencies
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: mockGet
  }),
  isAxiosError: jest.fn()
}));

// Mock Bottleneck (rate limiter)
jest.mock('bottleneck', () => {
  return function() {
    return {
      schedule: jest.fn(fn => fn())
    };
  };
});

// Mock createError function
jest.mock('../../../src/utils/asyncHandler', () => ({
  createError: jest.fn().mockImplementation((statusCode, message) => ({
    statusCode,
    message,
    isOperational: true
  }))
}));

describe('Yelp API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBusinessDetails', () => {
    it('should successfully fetch business details from Yelp API', async () => {
      const businessId = 'some-business-id';
      const mockResponse = {
        data: {
          id: 'some-business-id',
          name: 'Test Business',
          location: {
            city: 'San Francisco',
          },
        },
      };

      // Setup mock implementation
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await yelpAPIService.getBusinessDetails(businessId);

      // Verify axios was called correctly
      expect(axios.create).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledWith(encodeURIComponent(businessId));
      
      // Verify the result
      expect(result).toEqual(mockResponse);
    });

    it('should handle URL encoding for business IDs with special characters', async () => {
      const businessId = 'business/with&special?chars';
      const encodedBusinessId = encodeURIComponent(businessId);
      const mockResponse = { data: { id: businessId } };

      mockGet.mockResolvedValueOnce(mockResponse);

      await yelpAPIService.getBusinessDetails(businessId);

      // Verify axios was called with the encoded ID
      expect(mockGet).toHaveBeenCalledWith(encodedBusinessId);
    });

    it('should handle and wrap Axios errors properly', async () => {
      const businessId = 'nonexistent-business';
      const axiosError = {
        response: {
          status: 404,
          data: {
            error: {
              code: 'BUSINESS_NOT_FOUND',
              description: 'The requested business could not be found.',
            },
          },
        },
      };

      // Make axios.get throw an error
      mockGet.mockRejectedValueOnce(axiosError);
      
      // Configure axios.isAxiosError to return true
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);
      
      // Call the function and expect it to throw
      await expect(yelpAPIService.getBusinessDetails(businessId)).rejects.toBeTruthy();
      
      // Verify createError was called with the right parameters
      expect(createError).toHaveBeenCalledWith(
        404,
        'Yelp API Error: BUSINESS_NOT_FOUND, The requested business could not be found.'
      );
    });

    it('should rethrow non-Axios errors', async () => {
      const businessId = 'some-business';
      const genericError = new Error('Some other error');

      // Make axios.get throw a generic error
      mockGet.mockRejectedValueOnce(genericError);
      
      // Configure axios.isAxiosError to return false
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(false);

      // Call the function and expect it to throw the same error
      await expect(yelpAPIService.getBusinessDetails(businessId)).rejects.toEqual(genericError);
      
      // Verify createError was not called
      expect(createError).not.toHaveBeenCalled();
    });
  });
});