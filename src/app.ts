import compression from "compression";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { configureCors, blockIPMiddleware } from "./configs/cors.config";
import { SESSION_SECRET_KEY } from "./configs/env.configs";
import {
  logger,
  redAnsiColor,
  yellowAnsiColor,
  greenAnsiColor,
  morganStream,
} from "./configs/logger.configs";
import { getProtocol } from "./helpers/express.helpers";
import allRoutes from "./routes/index.routes";
import { CustomResponse, CustomRequest } from "./types/general.types";
// import * as xssClean from "xss-clean";

const app = express();

// 1. Logging Middleware (Capture all requests first)
app.use((req: Request, _res: CustomResponse, next: NextFunction) => {
  logger.info(
    `Request Entry Point - IP: ${req.headers.origin}, Method: ${
      req.method
    }, URL: ${getProtocol(req)}://${req.hostname}${req.originalUrl}`
  );
  next();
});

// Custom full URL token for Morgan
morgan.token("full-url", (req: Request) => {
  return `${req.originalUrl}`;
});

// Morgan middleware for detailed request logging
app.use(
  morgan(
    (tokens, req, res) => {
      const status = Number(tokens.status(req, res));
      let colorStatus;

      if (status >= 500) {
        colorStatus = redAnsiColor(status);
      } else if (status >= 400) {
        colorStatus = yellowAnsiColor(status);
      } else {
        colorStatus = greenAnsiColor(status);
      }

      return [
        `(IP: ${greenAnsiColor(tokens["remote-addr"](req, res))})`,
        `(Method: ${greenAnsiColor(tokens.method(req, res))})`,
        `(URL: ${greenAnsiColor(tokens["full-url"](req, res))} )`,
        `(STATUS: ${colorStatus})`,
        `(Res-Time: ${greenAnsiColor(
          tokens["response-time"](req, res) + " ms"
        )})`,
      ].join(" ~ ");
    },
    { stream: morganStream }
  )
);

// 2. Trust Proxy (For reverse proxies or load balancers)
app.set("trust proxy", 1);

// 3. Security Middleware (Helmet, CORS, IP Blocking)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "trusted-cdn.com",
          `'nonce-${crypto.randomBytes(16).toString("base64")}'`,
        ],
        styleSrc: [
          "'self'",
          `'nonce-${crypto.randomBytes(16).toString("base64")}'`,
        ],
        imgSrc: ["'self'"],
        connectSrc: ["'self'", "api.example.com"],
        frameSrc: ["'self'"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        objectSrc: ["'none'"],
        reportUri: "/csp-violation-report",
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true,
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  })
);

app.use(configureCors());
app.use(blockIPMiddleware);

// 4. Compression (After security, before parsing)
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (_req, res) => {
      return /json|text|javascript|css/.test(
        res.getHeader("Content-Type") as string
      );
    },
  })
);

// 5. Request Parsing (Body and Cookies)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SESSION_SECRET_KEY));

// 6. Static File Serving
app.use(express.static("public"));

// 7. Custom Middleware (e.g., Debug Mode)
app.use(
  (
    req: CustomRequest<unknown, unknown, unknown, { debugMode: boolean }>,
    _res: CustomResponse,
    next: NextFunction
  ) => {
    req.query.debugMode = true;
    next();
  }
);

// 8. Route-Specific Middleware and Routes
app.use(
  "/api",
  /* header("x-ss-app-id")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("School ID is Required")
    .isString()
    .withMessage("School ID must be a string")
    .matches(/^XSS_App_Bearer_.+/)
    .withMessage("Invalid Token Format"),
  handleValidationErrors, */
  // appValidationMiddleware,
  allRoutes
);

// 9. Basic Route
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

// 11. Error Handling (Last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    logger.error(
      `CORS Error: Blocked request from ${greenAnsiColor(
        req.headers.origin
      )} for path ${greenAnsiColor(req.originalUrl)}, Method: ${greenAnsiColor(
        req.method
      )}, IP: ${greenAnsiColor(req.ip)}`
    );
    res.status(403).json({ error: "CORS policy violation" });
  } else {
    next(err);
  }
});

// testEmailConnection();
// seedSuperAdmin();
// seedHubs();

export default app;
