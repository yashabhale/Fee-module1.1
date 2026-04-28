import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fee-management';
    
    const connection = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`MongoDB Disconnection Error: ${error.message}`);
  }
};
