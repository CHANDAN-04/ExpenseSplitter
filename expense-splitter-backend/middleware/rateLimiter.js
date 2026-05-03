const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// Strict limit for authentication endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req, res) => {
    // Don't rate limit in development
    return process.env.NODE_ENV === "development";
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      errorCode: "RATE_LIMIT_EXCEEDED",
    });
  },
});

// Strict limit for payment endpoints (10 requests per 15 minutes)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req, res) => {
    return process.env.NODE_ENV === "development";
  },
  handler: (req, res) => {
    logger.warn(`Payment rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      errorCode: "RATE_LIMIT_EXCEEDED",
    });
  },
});

// Moderate limit for general API endpoints (100 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req, res) => {
    return process.env.NODE_ENV === "development";
  },
  handler: (req, res) => {
    console.log(req.body);
    logger.warn(`General rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      errorCode: "RATE_LIMIT_EXCEEDED",
    });
  },
});

module.exports = {
  authLimiter,
  paymentLimiter,
  generalLimiter,
};
