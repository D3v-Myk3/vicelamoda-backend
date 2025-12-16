process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1); // Exit to ensure nodemon detects the crash
});

process.on("unhandledRejection", (reason: any, promise) => {
  if (reason?.error?.name === "TimeoutError") {
    console.error("Cloudinary Upload Timeout:", reason.error.message);
  } else {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  }
  // Optional: Don't exit on timeout if you want to keep the server alive,
  // but for now, we'll keep the exit to be safe, just with better logging.
  process.exit(1);
});

import dotenv from "dotenv";
import app from "./app";
import {
  DEFAULT_AI_MODEL,
  ENABLE_CLAUDE_FOR_ALL_CLIENTS,
} from "./configs/ai.config";
import { logger } from "./configs/logger.configs";
import "./configs/mongoose.config";

dotenv.config();

const port = process.env.PORT || 8881;

app.listen(port, () => {
  // Log AI model selection at startup for visibility
  logger.info("AI configuration", {
    defaultModel: DEFAULT_AI_MODEL,
    claudeEnabled: ENABLE_CLAUDE_FOR_ALL_CLIENTS,
  });

  logger.info(`Server is running on http://localhost:${port}`, {
    port: port,
    env: process.env.NODE_ENV,
  });
});
