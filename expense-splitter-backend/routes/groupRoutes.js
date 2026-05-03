const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validation");
const {
  createGroup,
  getSingleGroup,
  addMember,
  removeMember,
  getUserGroups,
  deleteGroup,
  leaveGroup,
  requestJoin,
  cancelJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  sendGroupJoinRequest,
  getPendingGroupJoinRequests,
  getUserGroupJoinRequests,
  acceptGroupJoinRequest,
  rejectGroupJoinRequest,
  cancelGroupJoinRequest,
  getGroupMembers,
  transferGroupAdmin,
} = require("../controllers/groupController");

const router = express.Router();

router.use(protect);

// --- Static paths first (before "/:groupId" catches segments like "join-request") ---
router.post("/", validate("createGroup"), createGroup);
router.get("/", getUserGroups);

router.post("/join-request/send", sendGroupJoinRequest);
router.get("/join-request/pending/:groupId", getPendingGroupJoinRequests);
router.get("/join-request/user", getUserGroupJoinRequests);
router.post("/join-request/accept", acceptGroupJoinRequest);
router.post("/join-request/reject", rejectGroupJoinRequest);
router.post("/join-request/cancel", cancelGroupJoinRequest);

// --- Group-scoped routes (specific paths before generic GET) ---
router.get("/:groupId/members", getGroupMembers);
router.patch("/:groupId/members", addMember);
router.delete("/:groupId/members/:userId", removeMember);
router.post("/:groupId/transfer-admin", transferGroupAdmin);
router.delete("/:groupId/leave", leaveGroup);
router.delete("/:groupId", deleteGroup);
router.get("/:groupId", getSingleGroup);

// --- Legacy join flow (array on Group document) ---
router.post("/:groupId/request", requestJoin);
router.delete("/:groupId/request", cancelJoinRequest);
router.post("/:groupId/approve", approveJoinRequest);
router.post("/:groupId/reject", rejectJoinRequest);

module.exports = router;
