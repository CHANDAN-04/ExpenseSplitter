const winston = require("winston");
const path = require("path");

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }),
);

// Create logger instance
const logger = winston.createLogger({
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    // Error file transport
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined file transport
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Simple wrapper functions for common log levels
module.exports = {
  info: (message) => logger.info(message),
  error: (message, error) =>
    logger.error(error ? `${message}: ${error.message}` : message),
  warn: (message) => logger.warn(message),
  debug: (message) => logger.debug(message),
  logRequest: (req, res) => {
    logger.info(`${req.method} ${req.path} - Status: ${res.statusCode}`);
  },
};
