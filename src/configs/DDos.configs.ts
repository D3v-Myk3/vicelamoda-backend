import { IRateLimiterMongoOptions } from "rate-limiter-flexible";
import mongoose from "./mongoose.config";

// Rate limiter configuration using MongoDB
export const mongoDDosServerConfig: IRateLimiterMongoOptions = {
  storeClient: mongoose.connection, // Mongoose connection works with RateLimiterMongo
  storeType: "mongodb",
  tableName: "rate_limiter", // Collection name in MongoDB
  keyPrefix: "CHV_Rate",
  points: 10, // Number of requests allowed
  duration: 2, // Time window in seconds (10 requests per 2 seconds)
  blockDuration: 3, // Block for 3 seconds if limit exceeded
  inMemoryBlockOnConsumed: 30, // Block in memory after 30 consumed points
  inMemoryBlockDuration: 3, // In-memory block duration in seconds
};
