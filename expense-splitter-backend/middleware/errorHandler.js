const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  let statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let errorCode = "INTERNAL_ERROR";
  let message = err.message || "An unexpected error occurred";

  // Log the error
  if (statusCode >= 500) {
    logger.error("Server error:", err);
  } else if (statusCode >= 400) {
    logger.warn(`Client error: ${message}`);
  }

  // Handle specific error types
  if (err.name === "SyntaxError" && err.status === 400) {
    statusCode = 400;
    errorCode = "INVALID_JSON";
    message = "Invalid JSON format in request body";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Validation failed";
  } else if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID_FORMAT";
    message = "Invalid ID format";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorCode = "TOKEN_EXPIRED";
    message = "Token has expired";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorCode = "INVALID_TOKEN";
    message = "Invalid token";
  } else if (err.code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_ENTRY";
    const dupKey =
      err.keyPattern && typeof err.keyPattern === "object"
        ? Object.keys(err.keyPattern)[0]
        : null;
    const kv = err.keyValue && typeof err.keyValue === "object" ? err.keyValue : {};
    if (dupKey === "username" || Object.prototype.hasOwnProperty.call(kv, "username")) {
      message = "Username is already taken";
    } else if (dupKey === "email" || Object.prototype.hasOwnProperty.call(kv, "email")) {
      message = "Email is already in use";
    } else if (dupKey === "userId" || Object.prototype.hasOwnProperty.call(kv, "userId")) {
      message = "Could not assign account id; please try again";
    } else {
      message = "Duplicate entry — this value must be unique";
    }
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    errorCode = err.errorCode || "ERROR";
  }

  // Prepare response
  const response = {
    success: false,
    message,
    errorCode,
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
