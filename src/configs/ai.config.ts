import dotenv from "dotenv";

// Load environment variables (safe to call even if dotenv was called elsewhere)
dotenv.config();

/**
 * Default AI model used by the application.
 * Set `DEFAULT_AI_MODEL` in your environment to override.
 */
export const DEFAULT_AI_MODEL: string =
  (process.env.DEFAULT_AI_MODEL as string) ?? "claude-haiku-4.5";

/**
 * Toggle to enable Claude Haiku 4.5 for all clients.
 * Set `ENABLE_CLAUDE_FOR_ALL_CLIENTS=false` to disable.
 */
export const ENABLE_CLAUDE_FOR_ALL_CLIENTS: boolean =
  ((process.env.ENABLE_CLAUDE_FOR_ALL_CLIENTS as string) ?? "true") === "true";

export default {
  DEFAULT_AI_MODEL,
  ENABLE_CLAUDE_FOR_ALL_CLIENTS,
};
