import mongoose from 'mongoose';
import { app } from './app';
import { env } from './config/env';

const connectToMongoDB = async (uri: string) => {
  // console.log(`Attempting to connect to MongoDB at ${uri}`);
  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB at ${uri}`);
    return true;
  } catch (error) {
    console.error(`Failed to connect to MongoDB at ${uri}:`, error);
    return false;
  }
};

const startServer = async () => {
  let connected = await connectToMongoDB(env.MONGODB_URI);

  if (!connected) {
    console.log('Retrying with MONGODB_STD_URI...');
    connected = await connectToMongoDB(env.MONGODB_STD_URI);
  }

  if (!connected) {
    console.error('Failed to connect to MongoDB. Exiting...');
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(
      `API Documentation available at http://localhost:${env.PORT}/api-docs`,
    );
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();
