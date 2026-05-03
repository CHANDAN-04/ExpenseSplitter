const jwt = require('jsonwebtoken');
const User = require('../models/User');

const extractToken = (headers) => {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) {
    return null;
  }

  const trimmed = String(authHeader).trim();
  if (!trimmed) {
    return null;
  }

  const [scheme, value] = trimmed.split(' ');
  if (value && scheme && scheme.toLowerCase() === 'bearer') {
    return value.trim();
  }

  return trimmed;
};

const isLikelyJwt = (token) => {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
};

const protect = async (req, res, next) => {
  try {
    const token = extractToken(req.headers);
    if (!token || token === 'null' || token === 'undefined' || !isLikelyJwt(token)) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId }).select('-password -_id -__v');

    if (!user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.message = 'Not authorized';
    }
    if (!res.statusCode || res.statusCode === 200) {
      res.status(401);
    }
    next(error);
  }
};

module.exports = { protect };
