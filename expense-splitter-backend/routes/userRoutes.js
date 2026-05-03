const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  searchUsers,
  getProfileWithRelationship,
  getFriendRequestsSummary,
  respondFriendRequest,
  updateProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getSentFriendRequests,
  getReceivedFriendRequests,
  getFriends,
  removeFriend,
} = require("../controllers/userController");

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/profile/:username", protect, getProfileWithRelationship);
router.get("/friend-requests", protect, getFriendRequestsSummary);
router.post("/respond-request", protect, respondFriendRequest);
router.post("/add-friend", protect, sendFriendRequest);

router.put("/profile", protect, updateProfile);

router.post("/friend-request/send", protect, sendFriendRequest);
router.post("/friend-request/accept", protect, acceptFriendRequest);
router.post("/friend-request/reject", protect, rejectFriendRequest);
router.get("/friend-request/pending", protect, getPendingRequests);
router.get("/friend-request/sent", protect, getSentFriendRequests);
router.get("/friend-request/received", protect, getReceivedFriendRequests);
router.get("/friends/list", protect, getFriends);

router.delete("/remove-friend/:username", protect, removeFriend);

module.exports = router;
