import mongoose from 'mongoose';
import { app } from './app';
import { env } from './config/env';

const startServer = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
      console.log(
        `API Documentation available at http://localhost:${env.PORT}/api-docs`,
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
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
