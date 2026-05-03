const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getGroupActivities } = require("../controllers/activityController");

const router = express.Router();

router.get("/:groupId", protect, getGroupActivities);

module.exports = router;
