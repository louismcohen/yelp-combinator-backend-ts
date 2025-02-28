import dotenv from 'dotenv';

// Load environment variables from .env.test file if it exists
dotenv.config({ path: '.env.test' });

// Override environment for tests
process.env.NODE_ENV = 'test';

// Set a default timeout for all tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep error logging for debugging failing tests
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Global beforeAll and afterAll hooks
beforeAll(async () => {
  console.log('Starting test suite');
});

afterAll(async () => {
  console.log('Finished test suite');
});
