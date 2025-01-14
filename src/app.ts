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
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/businesses', businessRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/embeddings', embeddingRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export { app };
