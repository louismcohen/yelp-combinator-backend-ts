import axios from 'axios';
import { yelpAPIService } from '../../../src/services/yelpAPI.service';
import { createError } from '../../../src/utils/asyncHandler';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

// Mock the asyncHandler's createError function
jest.mock('../../../src/utils/asyncHandler', () => ({
  createError: jest.fn(),
}));

describe('Yelp API Service', () => {
  let mockAxiosGet;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup the axios mock
    mockAxiosGet = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({
      get: mockAxiosGet,
    });
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

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const result = await yelpAPIService.getBusinessDetails(businessId);

      // Verify axios was called correctly
      expect(axios.create).toHaveBeenCalled();
      expect(mockAxiosGet).toHaveBeenCalledWith(businessId);
      
      // Verify the result
      expect(result).toEqual(mockResponse);
    });

    it('should handle URL encoding for business IDs with special characters', async () => {
      const businessId = 'business/with&special?chars';
      const encodedBusinessId = 'business%2Fwith%26special%3Fchars';
      const mockResponse = { data: { id: businessId } };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      await yelpAPIService.getBusinessDetails(businessId);

      // Verify axios was called with the encoded ID
      expect(mockAxiosGet).toHaveBeenCalledWith(encodedBusinessId);
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
      mockAxiosGet.mockRejectedValueOnce(axiosError);
      
      // Configure axios.isAxiosError to return true
      (axios.isAxiosError as jest.Mock).mockReturnValueOnce(true);
      
      // Configure createError to return a custom error
      const customError = new Error('Custom error');
      (createError as jest.Mock).mockReturnValueOnce(customError);

      // Call the function and expect it to throw
      await expect(yelpAPIService.getBusinessDetails(businessId)).rejects.toThrow(customError);

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
      mockAxiosGet.mockRejectedValueOnce(genericError);
      
      // Configure axios.isAxiosError to return false
      (axios.isAxiosError as jest.Mock).mockReturnValueOnce(false);

      // Call the function and expect it to throw the original error
      await expect(yelpAPIService.getBusinessDetails(businessId)).rejects.toThrow(genericError);
      
      // Verify createError was not called
      expect(createError).not.toHaveBeenCalled();
    });
  });
});