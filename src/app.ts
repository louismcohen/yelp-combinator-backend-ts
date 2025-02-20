import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { businessRoutes } from './routes/business.routes';
import { collectionRoutes } from './routes/collection.routes';
import { errorHandler } from './middleware/error.middleware';
import { env } from './config/env';
import { embeddingRoutes } from './routes/embedding.routes';
import { semanticRoutes } from './routes/semantic.routes';
import { searchRoutes } from './routes/search.routes';
import path from 'path';
import { writeFileSync } from 'fs';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// OpenAPI documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Yelp Combinator API',
      version: '1.0.0',
      description: 'API for managing Yelp collections and businesses',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
  explorer: true,
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve Swagger JSON file
app.get('/api-docs/swagger.json', (_req, res) => {
  res.sendFile(swaggerJsonPath);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    swaggerOptions: { url: '/api-docs/swagger.json' },
  }),
);

// Save Swagger JSON to a file dynamically
const swaggerJsonPath = path.join(__dirname, 'swagger.json');
writeFileSync(swaggerJsonPath, JSON.stringify(swaggerDocs, null, 2));

// Routes
app.use('/api/businesses', businessRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/embeddings', embeddingRoutes);
app.use('/api/semantic', semanticRoutes);
app.use('/api/search', searchRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export { app };
