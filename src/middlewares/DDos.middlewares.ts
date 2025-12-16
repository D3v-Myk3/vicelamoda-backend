import { NextFunction } from "express";
import { RateLimiterMongo } from "rate-limiter-flexible";

import { mongoDDosServerConfig } from "../configs/DDos.configs";
import { logger } from "../configs/logger.configs";
import { CustomRequest, CustomResponse } from "../types/general.types";

const rateLimiter = new RateLimiterMongo(mongoDDosServerConfig);

export const rateLimiterMiddleware = (
  req: CustomRequest,
  res: CustomResponse,
  next: NextFunction
) => {
  // console.log("*** Rate Limiter Middleware ***");

  if (!req.ip) {
    // console.error("IP address not found in request");
    logger.warn("IP address not found in request", {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      status: 400,
    });
    // Handle the error as needed (e.g., log it, send a response, etc.)
    return res.status(400).json({ data: null, message: "Bad Request" });
  }

  logger.info("IP address:", { ip: req.ip });

  rateLimiter
    .consume(req.ip)
    .then((rateLimiterRes) => {
      // Add rate limit headers to the response
      res.set({
        "X-RateLimit-Limit": mongoDDosServerConfig.points,
        "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + rateLimiterRes.msBeforeNext),
      });
      next();
    })
    .catch((rejRes) => {
      if (rejRes instanceof Error) {
        // console.error("Rate limiter error:", rejRes);
        logger.error("Rate limiter error", {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
          params: req.params,
          query: req.query,
          ip: req.ip,
          status: 500,
          message: rejRes.message,
        });
        // Handle the error as needed (e.g., log it, send a response, etc.)

        res.status(500).json({ data: null, message: "Internal Server Error" });
      } else {
        logger.warn("Retry after " + rejRes.msBeforeNext + " ms", {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
          params: req.params,
          query: req.query,
          ip: req.ip,
          status: 429,
          message: "Rate limit exceeded",
        });

        res.set(
          "Retry-After",
          Math.ceil(rejRes.msBeforeNext / 1000).toString()
        );
        res.status(429).json({ data: null, message: "Too Many Requests" });
      }
    });
};

/* const headers = {
  "Retry-After": rateLimiterRes.msBeforeNext / 1000,
  "X-RateLimit-Limit": opts.points,
  "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
  "X-RateLimit-Reset": new Date(Date.now() + rateLimiterRes.msBeforeNext)
}; */
