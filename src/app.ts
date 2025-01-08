import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { businessRoutes } from './routes/business.routes';
import { collectionRoutes } from './routes/collection.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/businesses', businessRoutes);
app.use('/api/collections', collectionRoutes);

app.use(errorHandler);

export { app };
