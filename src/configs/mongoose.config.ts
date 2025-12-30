import mongoose from "mongoose";
import { DATABASE_URL, DB_NAME } from "./env.configs";
import { logger } from "./logger.configs";

const globalForMongoose = globalThis as unknown as {
  mongoose: Promise<typeof mongoose> | null;
};

let mongooseConnection: Promise<typeof mongoose>;

if (!globalForMongoose.mongoose) {
  mongooseConnection = mongoose.connect(DATABASE_URL, {
    // bufferCommands: false,
    dbName: DB_NAME,
  }); // Default bufferCommands: true
  logger.info(`Attempting to connect to DB: ${DB_NAME}`);
  globalForMongoose.mongoose = mongooseConnection;
} else {
  mongooseConnection = globalForMongoose.mongoose;
}

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connected successfully");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

// Connect on import
mongooseConnection.catch((err) => {
  logger.error("Failed to connect to MongoDB:", err);
});

export default mongoose;
export { mongooseConnection };
