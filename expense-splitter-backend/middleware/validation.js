const Joi = require("joi");
const logger = require("../utils/logger");

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({ "string.email": "Invalid email format" }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({ "string.min": "Password must be at least 6 characters" }),
    name: Joi.string()
      .max(100)
      .required()
      .messages({
        "string.max": "Name must be less than 100 characters",
        "string.empty": "Name is required",
      }),
    // Must match User schema: unique handle; letters, digits, _, - only.
    username: Joi.string()
      .trim()
      .lowercase()
      .min(3)
      .max(30)
      .pattern(/^[a-z0-9_-]+$/)
      .required()
      .messages({
        "string.pattern.base":
          "Username can only use letters, numbers, underscore, and hyphen",
        "string.min": "Username must be at least 3 characters",
        "string.max": "Username must be less than 30 characters",
      }),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({ "string.email": "Invalid email format" }),
    password: Joi.string()
      .required()
      .messages({ "string.empty": "Password is required" }),
  }),

  // Group schemas
  createGroup: Joi.object({
    name: Joi.string().required().max(100).messages({
      "string.empty": "Group name is required",
      "string.max": "Group name must be less than 100 characters",
    }),
    members: Joi.array().items(Joi.string()).optional(),
  }),

  updateGroup: Joi.object({
    name: Joi.string().max(100).optional().messages({
      "string.max": "Group name must be less than 100 characters",
    }),
  }),

  // Expense schemas
  createExpense: Joi.object({
    title: Joi.string().required().max(200).messages({
      "string.empty": "Expense title is required",
      "string.max": "Expense title must be less than 200 characters",
    }),
    amount: Joi.number().positive().required().messages({
      "number.positive": "Amount must be a positive number",
      "any.required": "Amount is required",
    }),
    groupId: Joi.string()
      .required()
      .messages({ "string.empty": "Group ID is required" }),
    paidBy: Joi.string()
      .required()
      .messages({ "string.empty": "Paid by field is required" }),
    participants: Joi.array()
      .items(
        Joi.object({
          userId: Joi.string().required(),
          share: Joi.number().positive().required(),
        }),
      )
      .required()
      .messages({ "any.required": "Participants are required" }),
    splitType: Joi.string()
      .valid("equal", "exact", "percentage")
      .optional()
      .default("equal"),
    category: Joi.string().max(50).optional(),
    billImageUrl: Joi.string().uri().optional(),
  }),

  settlementRequest: Joi.object({
    groupId: Joi.string().required().messages({
      "string.empty": "groupId is required",
    }),
    toUserId: Joi.string().required().messages({
      "string.empty": "toUserId is required",
    }),
    amount: Joi.number().positive().required().messages({
      "number.positive": "Amount must be positive",
    }),
    type: Joi.string().valid("full", "partial").required(),
    note: Joi.string().max(500).allow("", null).optional(),
    paymentMode: Joi.string().valid("manual", "upi").optional(),
  }),

  settlementRespond: Joi.object({
    action: Joi.string().valid("approve", "reject").required(),
  }),

  // Settlement/Payment schemas
  createSettlement: Joi.object({
    groupId: Joi.string()
      .required()
      .messages({ "string.empty": "Group ID is required" }),
    fromUser: Joi.string()
      .required()
      .messages({ "string.empty": "From user is required" }),
    toUser: Joi.string()
      .required()
      .messages({ "string.empty": "To user is required" }),
    amount: Joi.number().positive().required().messages({
      "number.positive": "Amount must be positive",
      "any.required": "Amount is required",
    }),
  }),
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {Function} Middleware function
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    // Ensure req.body exists
    if (!req.body) {
      req.body = {};
    }

    if (!schemas[schemaName]) {
      logger.warn(`Validation schema not found: ${schemaName}`);
      return next();
    }

    const schema = schemas[schemaName];
    const { error, value } = schema.validate(req.body || {}, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      logger.warn(
        `Validation failed for ${schemaName}: ${JSON.stringify(messages)}`,
      );

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errorCode: "VALIDATION_ERROR",
        errors: messages,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Sanitize middleware - trim all string inputs safely
 */
const sanitizeInput = (req, res, next) => {
  try {
    const sanitize = (obj) => {
      if (!obj || typeof obj !== "object") {
        return;
      }

      try {
        Object.keys(obj).forEach((key) => {
          if (obj[key] === null || obj[key] === undefined) {
            return;
          }

          if (typeof obj[key] === "string") {
            obj[key] = obj[key].trim();
          } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item) => {
              if (item && typeof item === "object") {
                sanitize(item);
              }
            });
          } else if (typeof obj[key] === "object") {
            sanitize(obj[key]);
          }
        });
      } catch (innerError) {
        logger.warn("Error sanitizing object:", innerError.message);
      }
    };

    // Safely sanitize each part
    if (req.body && typeof req.body === "object") {
      sanitize(req.body);
    }
    if (req.params && typeof req.params === "object") {
      sanitize(req.params);
    }
    if (req.query && typeof req.query === "object") {
      sanitize(req.query);
    }

    next();
  } catch (error) {
    logger.error("Sanitization middleware error:", error);
    next(error);
  }
};

module.exports = {
  validate,
  sanitizeInput,
  schemas,
};
