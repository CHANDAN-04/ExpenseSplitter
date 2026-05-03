const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validation");
const { sanitizeUser } = require("../utils/formatters");

const router = express.Router();

router.post("/register", validate("register"), register);
router.post("/login", validate("login"), login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
    message: "User profile retrieved",
  });
});

module.exports = router;
