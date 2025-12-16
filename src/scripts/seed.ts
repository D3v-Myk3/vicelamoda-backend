import mongoose from "mongoose";
import { logger } from "../configs/logger.configs";
import { mongooseConnection } from "../configs/mongoose.config";
import { seedAdmin, seedAllShopData } from "../utils/seed.utils";

(async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info("🌱 Starting database seeding...");

    // Wait for MongoDB connection
    await mongooseConnection;

    // Run seeding
    await seedAdmin();
    await seedAllShopData();

    session.commitTransaction();
    logger.info("✅ Seeding completed successfully!");
  } catch (error) {
    console.log(error);

    session.abortTransaction();
    logger.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
})();
