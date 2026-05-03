const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateUserId } = require("../utils/publicId");
const {
  validateUsername,
  validateEmail,
  validatePassword,
} = require("../utils/validators");
const { sanitizeUser } = require("../utils/formatters");

const createUniqueUserId = async () => {
  let userId = "";
  let exists = true;

  while (exists) {
    userId = generateUserId();
    exists = await User.exists({ userId });
  }

  return userId;
};

// Generate access token (short-lived: 15m or 30m)
const generateAccessToken = (userId, username) =>
  jwt.sign({ userId, username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
  });

// Generate refresh token (long-lived: 7d)
const generateRefreshToken = (userId, username) =>
  jwt.sign({ userId, username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  });

const register = async (req, res, next) => {
  try {
    const { name, email, password, username } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email, and password are required");
    }

    // Validate inputs
    let usernameError = validateUsername(username);
    if (usernameError) {
      res.status(400);
      throw new Error(usernameError);
    }

    let emailError = validateEmail(email);
    if (emailError) {
      res.status(400);
      throw new Error(emailError);
    }

    let passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400);
      throw new Error(passwordError);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check email uniqueness
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(409);
      throw new Error("Email already in use");
    }

    // Check username uniqueness
    const existingUsername = await User.findOne({
      username: normalizedUsername,
    });
    if (existingUsername) {
      res.status(409);
      throw new Error("Username already taken");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await createUniqueUserId();

    const user = await User.create({
      userId,
      username: normalizedUsername,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      friends: [],
      refreshTokens: [],
    });

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(user.userId, user.username);
    const refreshToken = generateRefreshToken(user.userId, user.username);

    // Store refresh token in DB
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: sanitizeUser(user),
      },
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+refreshTokens",
    );

    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(user.userId, user.username);
    const refreshToken = generateRefreshToken(user.userId, user.username);

    // Store refresh token in DB - initialize if undefined
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: sanitizeUser(user),
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token endpoint
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400);
      throw new Error("Refresh token is required");
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      res.status(401);
      throw new Error("Invalid refresh token");
    }

    // Find user and check if refresh token exists in DB
    const user = await User.findOne({ userId: decoded.userId }).select(
      "+refreshTokens",
    );

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      res.status(401);
      throw new Error("Refresh token not valid or expired");
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.userId, user.username);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        token: newAccessToken, // For backward compatibility
      },
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Logout endpoint - revoke refresh token
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400);
      throw new Error("Refresh token is required");
    }

    // Find user and remove refresh token from DB
    const user = await User.findOne({ userId: req.user.userId }).select(
      "+refreshTokens",
    );

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (token) => token !== refreshToken,
      );
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {},
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  generateAccessToken,
  generateRefreshToken,
};
