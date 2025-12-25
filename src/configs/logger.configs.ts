/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import {
  CustomRequest,
  DefaultReturnObj,
  LogAndReturnType,
} from "../types/general.types";

// Define ANSI colors
export const greenAnsiColor = (text?: string | number | null) =>
  text ? `\x1b[32m${text}\x1b[0m` : "";
export const yellowAnsiColor = (text?: string | number | null) =>
  text ? `\x1b[33m${text}\x1b[0m` : "";
export const redAnsiColor = (text?: string | number | null) =>
  text ? `\x1b[31m${text}\x1b[0m` : "";

interface TransformableInfo {
  level: string; // The log level (e.g., 'info', 'error')
  message: unknown; // The main log message
  service?: string;
  // [key: string]: any; // Allows additional arbitrary properties
  timestamp?: string; // Optional timestamp added by winston.format.timestamp
  metadata?: Record<string, any>; // Optional metadata object added by winston.format.metadata
}

// Custom JSON format with metadata as a nested object
const customJsonFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.metadata(), // Explicitly include metadata
  winston.format((info: TransformableInfo) => {
    // Ensure metadata is a plain object
    const metadata =
      info.metadata && typeof info.metadata === "object"
        ? info.metadata.metadata
        : {};
    return {
      metadata: { ...metadata }, // Nest metadata under its own key
      timestamp: metadata.timestamp,
      level: info.level,
      message: info.message as string,
      service: "vicelamoda-server",
    };
  })(),
  winston.format.json({ space: 2 })
);

// String format for console with metadata
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD ~ HH:mm:ss",
  }),
  winston.format.metadata(),
  winston.format.printf((info: TransformableInfo): string => {
    const mess = info.message as string;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const messageWithLinks = mess.replace(
      urlRegex,
      "\x1B]8;;$1\x1B\\$1\x1B]8;;\x1B\\"
    );

    return `\n${info.level} log: ${
      info.metadata!.timestamp
    } ~ ${messageWithLinks}
    \n============================================================================= \n`;
    /* return `\n${info.level} log: ${info.metadata!.timestamp} ~ ${info.message}
    \n================================== \n`; */
  })
);

// Create Winston logger
export const logger = winston.createLogger({
  level: "debug", // Set to 'debug' to allow all standard levels (error, warn, info, verbose, debug, silly)
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Base timestamp
    winston.format.metadata({}) // Base metadata handling
  ),
  transports: [
    new DailyRotateFile({
      filename: "logs/application-%DATE%.json.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "140d",
      format: customJsonFormat,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: "logs/error.json.log",
      level: "error", // Restrict to error level only
      handleExceptions: true,
      handleRejections: true,
      format: customJsonFormat,
    }),
    new winston.transports.File({
      filename: "logs/combined.json.log",
      format: customJsonFormat,
    }),
  ],
});

/* // Create a stream for Morgan to use Winston
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
}; */

export const morganStream = {
  write: (message: string) => {
    // Debug raw Morgan message

    // Extract status code using a more robust regex
    const statusMatch = message.match(/\(STATUS: (\d+)\)/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

    if (status >= 500) {
      logger.error(message.trim());
    } else if (status >= 400) {
      logger.warn(message.trim());
    } else {
      logger.info(message.trim());
    }
  },
};

// Customizable skip function for Morgan middleware
export const morganSkip = (
  req: CustomRequest<unknown, unknown, unknown, { debug: boolean }>,
  res: Response
): boolean => {
  // Environment-based condition
  const isProduction = process.env.NODE_ENV === "production"; // Skip in production environment
  // const isDevelopment = process.env.NODE_ENV === 'development'; // Example: Skip in development

  // Route-based conditions
  const isHealthCheck = req.url === "/healthcheck"; // Skip for healthcheck endpoint
  const isStaticAsset = req.url.startsWith("/static"); // Skip for static assets (e.g., /static/images)
  // const isApiRoute = req.url.startsWith('/api'); // Example: Skip for API routes

  // Method-based conditions
  const isGetRequest = req.method === "GET"; // Skip for GET requests
  // const isPostRequest = req.method === 'POST'; // Example: Skip for POST requests

  // Status code-based conditions
  const isSuccess = res.status < 400; // Skip for successful responses (200-399)
  // const isError = res.statusCode >= 500; // Example: Skip for server errors (500+)

  // Query parameter-based conditions
  const isDebugDisabled = req.query.debug === false; // Skip if debug query param is false
  // const hasToken = !!req.query.token; // Example: Skip if token query param exists

  // Header-based conditions
  const isBot = req.headers["user-agent"]?.includes("bot") || false; // Skip for bot user agents
  // const isAuthenticated = !!req.headers['authorization']; // Example: Skip for authenticated requests

  // Debug logging to inspect conditions (remove in production)
  // eslint-disable-next-line no-console
  console.log("Skip conditions:", {
    isProduction,
    isHealthCheck,
    isStaticAsset,
    isGetRequest,
    isSuccess,
    isDebugDisabled,
    isBot,
  });

  // Combine conditions here (edit this to your taste)
  return (
    isProduction || // Skip in production
    isHealthCheck || // Skip healthcheck requests
    isStaticAsset || // Skip static asset requests
    isSuccess || // Skip successful responses
    isDebugDisabled || // Skip if debug is disabled
    isBot // Skip bot requests
  );

  // Example with AND logic:
  // return isProduction && isGetRequest; // Skip only GET requests in production

  // Example with mixed logic:
  // return (isProduction && isGetRequest) || isHealthCheck || (isSuccess && !isDebugDisabled);
};

export const createErrorResponse = (
  message: string,
  source: string,
  status: number
): DefaultReturnObj<string> => ({
  data: null,
  errorMessage: message,
  source,
  status: status || StatusCodes.BAD_REQUEST,
});

export const logAndReturnError = ({
  source,
  message,
  log_level,
  context,
  details,
  status,
}: LogAndReturnType) => {
  logger[log_level](message, {
    source: `${source} (${context})`,
    status,
    ...details,
  });

  return createErrorResponse(message, `${source} (${context})`, status);
};
