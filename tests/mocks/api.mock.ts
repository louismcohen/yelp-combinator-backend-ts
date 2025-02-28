import axios from 'axios';
import { mockYelpBusinessSearchResponse, mockYelpBusinessDetailsResponse } from '../fixtures/yelp-api.fixtures';
import { mockAnthropicSearchResponse } from '../fixtures/anthropic-api.fixtures';

// Mock Axios for Yelp API calls
export const mockYelpAPI = () => {
  jest.mock('axios');
  
  // Mock for Yelp business search
  (axios.get as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('businesses/search')) {
      return Promise.resolve({ data: mockYelpBusinessSearchResponse });
    }
    
    // Mock for Yelp business details
    if (url.includes('businesses/') && !url.includes('search')) {
      return Promise.resolve({ data: mockYelpBusinessDetailsResponse });
    }
    
    return Promise.reject(new Error(`No mock for URL: ${url}`));
  });
};

// Mock Anthropic API
export const mockAnthropicAPI = () => {
  jest.mock('@anthropic-ai/sdk', () => {
    return {
      default: jest.fn().mockImplementation(() => ({
        messages: {
          create: jest.fn().mockResolvedValue(mockAnthropicSearchResponse),
        },
      })),
    };
  });
};