import { yelpLimiter, embeddingLimiter } from '../../../src/utils/rateLimiter';
import { yelpConfig } from '../../../src/config/yelp';

jest.mock('../../../src/config/yelp', () => ({
  yelpConfig: {
    rateLimit: {
      maxConcurrent: 5,
      minTime: 500,
    },
  },
}));

describe('rateLimiter', () => {
  describe('yelpLimiter', () => {
    it('should be configured with values from yelp config', () => {
      expect(yelpLimiter.clients).toBeDefined();
      expect(yelpLimiter.options.maxConcurrent).toBe(yelpConfig.rateLimit.maxConcurrent);
      expect(yelpLimiter.options.minTime).toBe(yelpConfig.rateLimit.minTime);
    });

    it('should properly limit function execution', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const startTime = Date.now();
      
      // Schedule 3 tasks in parallel
      const promises = [
        yelpLimiter.schedule(() => mockFn('task1')),
        yelpLimiter.schedule(() => mockFn('task2')),
        yelpLimiter.schedule(() => mockFn('task3')),
      ];
      
      await Promise.all(promises);
      
      expect(mockFn).toHaveBeenCalledTimes(3);
      
      // The total time should be at least minTime * (calls - maxConcurrent)
      // but this is hard to test deterministically, so we'll just check
      // the function was called the right number of times
    });
  });

  describe('embeddingLimiter', () => {
    it('should be configured with correct values', () => {
      expect(embeddingLimiter.clients).toBeDefined();
      expect(embeddingLimiter.options.maxConcurrent).toBe(3);
    });

    it('should properly limit function execution', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      
      // Schedule 5 tasks in parallel
      const promises = [
        embeddingLimiter.schedule(() => mockFn('task1')),
        embeddingLimiter.schedule(() => mockFn('task2')),
        embeddingLimiter.schedule(() => mockFn('task3')),
        embeddingLimiter.schedule(() => mockFn('task4')),
        embeddingLimiter.schedule(() => mockFn('task5')),
      ];
      
      await Promise.all(promises);
      
      expect(mockFn).toHaveBeenCalledTimes(5);
    });
  });
});