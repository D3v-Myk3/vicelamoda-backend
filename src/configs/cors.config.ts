import cors from "cors";
import { NextFunction, Request, Response } from "express";
import { CLIENT_DOMAIN } from "./env.configs";
import { greenAnsiColor, logger } from "./logger.configs";

// List of blocked IP addresses
// const blockedIPs: string[] = ["192.168.0.132"];
// const blockedIPs: string[] = ["192.168.0.159"];
const blockedIPs: string[] = [];

// Middleware to block IPs
export const blockIPMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIP = req.ip || req.socket.remoteAddress || "";

  // Normalize IP (remove IPv6 prefix if present)
  const normalizedIP = clientIP.replace(/^::ffff:/, "");

  if (blockedIPs.includes(normalizedIP)) {
    logger.warn(`IP: ${greenAnsiColor(normalizedIP)} has been Blocked`);
    res.status(403).json({ message: "Access denied: Your IP is blocked" });
    return;
  }

  next();
};

export const configureCors = () => {
  const allowedOrigins = [
    "http://localhost:8080",
    "http://192.168.0.5:3000",
    // "https://fjwnqc0d-3000.uks1.devtunnels.ms",
    CLIENT_DOMAIN,
    "https://l3hbgspw-3000.uks1.devtunnels.ms",
    // "https://0q87stj0-3000.uks1.devtunnels.ms"
  ];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl)
      if (!origin) {
        logger.info(`CORS: Allowing request with no origin`);
        return callback(null, true);
      }

      // Check if the origin is allowed
      if (allowedOrigins.includes(origin)) {
        logger.info(`CORS: Allowing request from ${greenAnsiColor(origin)}`);
        callback(null, true);
      } else {
        // Log the blocked request
        logger.error(
          `CORS: Blocked request from origin: ${greenAnsiColor(origin)}`
        );
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "X-Requested-With",
      "x-auth-verification-token",
      "x-vcl-ad-auth-token",
      "x-vcl-mgr-auth-token",
      "x-vcl-csh-auth-token",
      "x-vcl-auth-token",
      "Accept",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    credentials: true,
    preflightContinue: false,
    maxAge: 300,
    optionsSuccessStatus: 204,
  });
};
