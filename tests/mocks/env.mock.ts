import { z } from 'zod';

// Mock environment variables for testing
export const mockEnv = {
  NODE_ENV: 'test',
  PORT: '3001',
  MONGODB_URI: 'mongodb://localhost:27017/yelp-combinator-test',
  MONGODB_STD_URI: 'mongodb://localhost:27017/yelp-combinator-test',
  YELP_API_KEY: 'test-yelp-api-key',
  ANTHROPIC_API_KEY: 'test-anthropic-api-key',
  POSTMAN_API_KEY: 'test-postman-api-key',
  POSTMAN_COLLECTION_UID: 'test-collection-uid',
  MONGODB_OLD_URI: 'mongodb://localhost:27017/yelp-combinator-old-test',
};

// Helper function to mock the env module
export const mockEnvModule = () => {
  jest.mock('../../src/config/env', () => ({
    env: mockEnv,
  }));
};