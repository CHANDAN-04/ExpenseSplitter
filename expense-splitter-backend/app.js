const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { sanitizeInput } = require("./middleware/validation");

const {
  authLimiter,
  paymentLimiter,
  generalLimiter,
} = require("./middleware/rateLimiter");
const logger = require("./utils/logger");

const app = express();

// Security middleware - helmet (before parsing)
app.use(helmet());

// CORS (before parsing)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  }),
);

// HTTP request logging - morgan (before body parsing to avoid consuming body)
const morganFormat =
  process.env.NODE_ENV === "production"
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'
    : ":method :url :status :res[content-length] - :response-time ms";

app.use(
  morgan(morganFormat, {
    skip: (req, res) => {
      return (
        process.env.NODE_ENV === "development" && req.path === "/api/health"
      );
    },
  }),
);

// Body parsing - EXPRESS ORDER CRITICAL
// Must parse JSON and URL-encoded BEFORE any middleware that uses req.body

// 1. Capture raw body for all requests
app.use(express.raw({ type: "*/*", limit: "50mb" }));

// 2. Parse captured raw body as JSON/text
app.use((req, res, next) => {
  if (req.body && Buffer.isBuffer(req.body)) {
    const bodyStr = req.body.toString("utf8").trim();

    // Try to parse as JSON
    if (bodyStr.startsWith("{") || bodyStr.startsWith("[")) {
      try {
        req.body = JSON.parse(bodyStr);
        return next();
      } catch (e) {
        // JSON parse failed, leave as string
        req.body = bodyStr;
        return next();
      }
    }

    // Try to parse as URL-encoded form data
    if (bodyStr.includes("=") && bodyStr.includes("&")) {
      try {
        const params = new URLSearchParams(bodyStr);
        req.body = Object.fromEntries(params);
        return next();
      } catch (e) {
        req.body = bodyStr;
      }
    }

    // Leave as is if not parseable
    req.body = bodyStr;
  }

  // Ensure req.body exists
  if (!req.body) {
    req.body = {};
  }

  next();
});

// 3. Also parse standard JSON and URL-encoded (backup)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Custom body parsing error handler - catches JSON parse errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
      errorCode: "INVALID_JSON",
    });
  }
  next(error);
});

// Debug middleware - log incoming request body (remove in production)
app.use((req, res, next) => {
  if (
    req.path.includes("/api/auth/register") ||
    req.path.includes("/api/auth/login")
  ) {
    logger.info(`Incoming ${req.method} ${req.path}`, {
      contentType: req.get("content-type"),
      bodyKeys: req.body ? Object.keys(req.body) : "empty",
      bodyPreview: req.body
        ? JSON.stringify(req.body).substring(0, 100)
        : "no body",
    });
  }
  next();
});

// Defensive sanitization - check if body exists
const safeInput = (req, res, next) => {
  try {
    // Ensure req.body exists
    if (!req.body) {
      req.body = {};
    }
    sanitizeInput(req, res, next);
  } catch (error) {
    logger.error("Sanitization error:", error);
    next(error);
  }
};

app.use(safeInput);

// Apply rate limiting AFTER body parsing but BEFORE routes
// Auth endpoints get strict limits
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Payment endpoints get strict limits
app.use("/api/payments", paymentLimiter);

// All other endpoints get moderate limits
app.use("/api", generalLimiter);

// Routes
app.use("/api", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errorCode: "NOT_FOUND",
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
