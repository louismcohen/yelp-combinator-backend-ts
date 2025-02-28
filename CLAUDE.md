# Yelp Combinator Backend - Development Guidelines

## Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- Development server: `npm run dev`
- Start production: `npm start`
- Download ML models: `npm run download-models`
- Run tests: `npm test`
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration`
- Run tests with coverage: `npm run test:coverage`

## Code Style

- Use TypeScript strict mode for all files
- Imports: group in order - Node built-ins, external libs, internal modules
- Naming: camelCase for variables/functions, PascalCase for classes/interfaces
- Error handling: use asyncHandler for Express routes, create custom errors with createError()
- Use Zod for input validation and type inference
- Document functions with JSDoc comments
- Follow RESTful patterns for API endpoints

## Architecture

- Controllers handle HTTP requests and responses
- Services encapsulate business logic
- Models define database schemas and interfaces
- Routes define API endpoints
- Middleware handles cross-cutting concerns
- Utils provide reusable helper functions

## Type Safety

- Always define proper interfaces/types
- Use explicit return types for functions
- Prefer interfaces for object definitions
- Use type guards for runtime type checking
