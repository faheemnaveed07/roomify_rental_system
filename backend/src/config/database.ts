import mongoose, { ConnectOptions } from 'mongoose';
import { env } from './environment';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  uri: string;
  options: ConnectOptions;
}

const getDatabaseConfig = (): DatabaseConfig => {
  // Normalize common 'localhost' to IPv4 to avoid trying IPv6 ::1 which may not be bound
  const normalizedUri = env.MONGODB_URI.replace(/\blocalhost\b/g, '127.0.0.1');

  return {
    uri: normalizedUri,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  };
};

export const connectDatabase = async (): Promise<typeof mongoose> => {
  const config = getDatabaseConfig();

  try {
    const connection = await mongoose.connect(config.uri, config.options);
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (error: Error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    // In development, allow the app to start even if MongoDB is not available.
    if (env.NODE_ENV === 'development') {
      logger.warn('Running without MongoDB in development mode. Some features may not work.');
      // Return mongoose object so callers can continue (some code may check connection state).
      // Note: this means DB-dependent routes may still fail at runtime.
      return mongoose as any;
    }
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

export default { connectDatabase, disconnectDatabase };
