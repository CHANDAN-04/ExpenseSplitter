const logger = require("../utils/logger");

/**
 * Validate that all required environment variables are set
 * Throws error and exits process if any are missing
 */
const validateEnvironment = () => {
  const requiredEnvVars = [
    "JWT_SECRET",
    "MONGODB_URI",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
  ];

  const missingVars = [];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(", ")}`;
    logger.error(message);
    console.error(`\n❌ FATAL ERROR: ${message}`);
    console.error(
      "Please set all required environment variables in your .env file\n",
    );
    process.exit(1);
  }

  logger.info("✓ All required environment variables are set");
};

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {*} fallback - Fallback value if not set
 * @returns {*} Environment value or fallback
 */
const getEnv = (key, fallback = null) => {
  return process.env[key] !== undefined ? process.env[key] : fallback;
};

module.exports = {
  validateEnvironment,
  getEnv,
};
