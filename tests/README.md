# Testing Guide for Yelp Combinator Backend

This directory contains all tests for the Yelp Combinator Backend project.

## Test Structure

- `unit/`: Tests for individual functions and components in isolation
- `integration/`: Tests for API endpoints and service interactions
- `fixtures/`: Mock data used in tests
- `mocks/`: Mock implementations of external dependencies

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (great for development)
npm run test:watch
```

## Writing Tests

### Unit Tests

Unit tests should focus on testing a single function or component in isolation. Dependencies should be mocked.

Example:
```typescript
// tests/unit/services/search.service.test.ts
import { searchService } from '../../../src/services/search.service';

describe('Search Service', () => {
  it('should process a natural language query', async () => {
    // Test logic here
  });
});
```

### Integration Tests

Integration tests should test multiple components working together, such as API endpoints.

Example:
```typescript
// tests/integration/api/search.api.test.ts
import request from 'supertest';
import app from '../../../src/app';

describe('Search API', () => {
  it('should return search results for a valid request', async () => {
    // Test logic here
  });
});
```

## Mocking External Services

External services like the Yelp API and Anthropic API should be mocked in tests:

```typescript
import { mockYelpAPI, mockAnthropicAPI } from '../../mocks/api.mock';

beforeEach(() => {
  mockYelpAPI();
  mockAnthropicAPI();
});
```

## Adding Test Coverage

When adding new features, please add corresponding tests to maintain good test coverage.

- Business logic should have unit tests
- API endpoints should have integration tests
- Utilities should have unit tests