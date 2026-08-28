import mongoose from 'mongoose';
import { config } from './config';

/**
 * Connect to MongoDB. Exits the process on failure so the container restarts.
 */
export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`[db] connected to ${config.mongoUri}`);
  } catch (err) {
    console.error('[db] connection error', err);
    process.exit(1);
  }
}
