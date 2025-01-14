import Bottleneck from 'bottleneck';
import axios from 'axios';
import { env } from '../config/env';
import { createError } from '../utils/asyncHandler';

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 500,
});

const yelpAxiosInstance = axios.create({
  baseURL: 'https://api.yelp.com/v3/businesses/',
  headers: {
    Authorization: `Bearer ${env.YELP_API_KEY}`,
    Accept: 'application/json',
  },
});

export const yelpAPIService = {
  getBusinessDetails: async (businessId: string) => {
    try {
      const encodedBusinessId = encodeURIComponent(businessId);
      return await limiter.schedule(() =>
        yelpAxiosInstance.get(`${encodedBusinessId}`),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
        console.error('Status code:', error.response?.status);
        console.error('Headers:', error.response?.headers);
        throw createError(
          error.response?.status || 500,
          `Yelp API Error: ${error.response?.data.error.code}, ${error.response?.data.error.description}`,
        );
      }
      throw error;
    }
  },
};
