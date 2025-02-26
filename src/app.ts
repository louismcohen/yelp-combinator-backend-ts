import express, { Request, Response } from 'express';
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
import openapiToPostman, { ConvertResult } from 'openapi-to-postmanv2';
import axios from 'axios';

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
const swaggerJsonPath = path.join(__dirname, 'swagger.json');
app.get('/api-docs/swagger.json', (_req: Request, res: Response) => {
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
writeFileSync(swaggerJsonPath, JSON.stringify(swaggerDocs, null, 2));

// Function to update Postman collection
const updatePostmanCollection = async (postmanCollection: object) => {
  try {
    await axios.put(
      `https://api.getpostman.com/collections/${env.POSTMAN_COLLECTION_UID}`,
      { collection: postmanCollection },
      {
        headers: {
          'X-Api-Key': env.POSTMAN_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('Postman collection updated successfully');
  } catch (error) {
    console.error('Error updating Postman collection:', error);
  }
};

// Convert OpenAPI (Swagger) JSON to Postman Collection
openapiToPostman.convert(
  { type: 'json', data: JSON.stringify(swaggerDocs) },
  {},
  async (err: unknown, conversionResult: ConvertResult) => {
    if (!conversionResult.result) {
      console.error(
        'Error converting OpenAPI to Postman:',
        conversionResult.reason,
      );
    } else {
      await updatePostmanCollection(conversionResult.output[0].data);
    }
  },
);

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
