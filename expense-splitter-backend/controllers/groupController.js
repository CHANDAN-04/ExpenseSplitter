const Group = require("../models/Group");
const User = require("../models/User");
const { getIo } = require("../services/socket");
const { generateGroupId } = require("../utils/publicId");
const { sanitizeGroup } = require("../utils/formatters");
const balanceService = require("../services/balanceService");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function assertZeroNetBalance(groupId, userId, res) {
  const { balances } = await balanceService.calculateGroupBalances(groupId);
  const rows = balances || [];
  const row = rows.find((b) => String(b.userId) === String(userId));
  if (row && Math.abs(row.net) > 0.009) {
    res.status(409);
    throw new Error(
      `Outstanding balance of ₹${Math.abs(row.net).toFixed(2)} in this group. Settle up first.`,
    );
  }
}

const createUniqueGroupId = async (name) => {
  let candidate = "";
  let exists = true;

  while (exists) {
    candidate = generateGroupId(name);
    exists = await Group.exists({ groupId: candidate });
  }

  return candidate;
};

const findGroup = (groupId) =>
  Group.findOne({ groupId: String(groupId).trim(), isDeleted: false });

const ensureUsersExist = async (userIds) => {
  const normalized = Array.from(
    new Set((userIds || []).map((id) => String(id).trim()).filter(Boolean)),
  );
  const count = await User.countDocuments({ userId: { $in: normalized } });
  return count === normalized.length;
};

const assertGroupAdmin = (group, userId, res) => {
  if (String(group.createdBy) !== String(userId)) {
    res.status(403);
    throw new Error("Only group admin can perform this action");
  }
};

const isGroupMember = (group, userId) =>
  (group.members || []).map(String).includes(String(userId));

const createGroup = async (req, res, next) => {
  try {
    const { name, members = [] } = req.body;

    if (!name) {
      res.status(400);
      throw new Error("Group name is required");
    }

    const creatorUserId = req.user.userId;

    // Check if group with same name already exists for this user
    const existingGroup = await Group.findOne({
      name: name.trim(),
      createdBy: creatorUserId,
      isDeleted: false,
    });

    if (existingGroup) {
      res.status(409);
      throw new Error("You already have a group with this name");
    }

    const normalizedMembers = Array.from(
      new Set([
        creatorUserId,
        ...members.map((member) => String(member).trim()),
      ]),
    );

    const allUsersExist = await ensureUsersExist(normalizedMembers);
    if (!allUsersExist) {
      res.status(400);
      throw new Error("One or more members are invalid");
    }

    const group = await Group.create({
      groupId: await createUniqueGroupId(name),
      name: name.trim(),
      members: normalizedMembers,
      createdBy: creatorUserId,
      joinRequests: [],
    });

    const io = getIo();
    for (const member of group.members) {
      io.to(`user:${member}`).emit("group:created", {
        group: sanitizeGroup(group),
      });
    }

    res.status(201).json({
      success: true,
      data: sanitizeGroup(group),
      message: "Group created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getSingleGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    // Check if user is member
    if (!isGroupMember(group, req.user.userId)) {
      res.status(403);
      throw new Error("Not a member of this group");
    }

    res.status(200).json({
      success: true,
      data: sanitizeGroup(group),
      message: "Group retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error("userId is required");
    }

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    assertGroupAdmin(group, req.user.userId, res);

    const memberExists = await User.exists({ userId: String(userId).trim() });
    if (!memberExists) {
      res.status(400);
      throw new Error("Member not found");
    }

    const uid = String(userId).trim();
    if (!group.members.map(String).includes(uid)) {
      group.members.push(uid);
      group.joinRequests = (group.joinRequests || []).filter(
        (idValue) => String(idValue) !== uid,
      );
      await group.save();
    }

    const io = getIo();
    for (const member of group.members) {
      io.to(`user:${member}`).emit("group:updated", {
        group: sanitizeGroup(group),
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeGroup(group),
      message: "Member added successfully",
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;

    if (!userId) {
      res.status(400);
      throw new Error("userId is required");
    }

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    assertGroupAdmin(group, req.user.userId, res);

    if (!isGroupMember(group, userId)) {
      res.status(404);
      throw new Error("Member not in group");
    }

    if (String(group.createdBy) === String(userId)) {
      res.status(400);
      throw new Error("Cannot remove group admin");
    }

    await assertZeroNetBalance(groupId, userId, res);

    group.members = group.members.filter((id) => String(id) !== String(userId));
    await group.save();

    const io = getIo();
    for (const member of group.members) {
      io.to(`user:${member}`).emit("group:updated", {
        group: sanitizeGroup(group),
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeGroup(group),
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getUserGroups = async (req, res, next) => {
  try {
    const userId = String(req.user.userId);
    const discover =
      req.query.discover === "true" ||
      req.query.discover === "1" ||
      req.query.discover === "yes";
    const q = req.query.search?.trim() || req.query.q?.trim();

    if (discover) {
      const filter = {
        isDeleted: false,
        members: { $nin: [userId] },
      };
      if (q) {
        filter.name = { $regex: escapeRegex(q), $options: "i" };
      }
      const groups = await Group.find(filter)
        .sort({ updatedAt: -1 })
        .limit(40)
        .select("groupId name members createdAt");

      const data = groups.map((g) => ({
        groupId: g.groupId,
        name: g.name,
        memberCount: (g.members || []).length,
      }));

      return res.status(200).json({
        success: true,
        data,
        message: "Discover groups retrieved successfully",
      });
    }

    const filter = { isDeleted: false, members: userId };
    if (q) {
      filter.name = { $regex: escapeRegex(q), $options: "i" };
    }

    const groups = await Group.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: groups.map(sanitizeGroup),
      message: "Groups retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    assertGroupAdmin(group, req.user.userId, res);

    group.isDeleted = true;
    await group.save();

    const io = getIo();
    for (const member of group.members) {
      io.to(`user:${member}`).emit("group:deleted", { groupId: group.groupId });
    }

    res.status(200).json({
      success: true,
      data: { groupId: group.groupId },
      message: "Group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    if (!isGroupMember(group, userId)) {
      res.status(400);
      throw new Error("Not a member of this group");
    }

    if (String(group.createdBy) === String(userId)) {
      res.status(400);
      throw new Error(
        "Group admin cannot leave. Transfer ownership or delete the group.",
      );
    }

    await assertZeroNetBalance(groupId, userId, res);

    group.members = group.members.filter((id) => String(id) !== String(userId));
    group.joinRequests = (group.joinRequests || []).filter(
      (id) => String(id) !== String(userId),
    );
    await group.save();

    const io = getIo();
    for (const member of group.members) {
      io.to(`user:${member}`).emit("group:updated", {
        group: sanitizeGroup(group),
      });
    }

    res.status(200).json({
      success: true,
      data: { groupId: group.groupId },
      message: "Left group successfully",
    });
  } catch (error) {
    next(error);
  }
};

const requestJoin = async (req, res, next) => {
  try {
    const group = await findGroup(req.params.groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    const requester = req.user.userId;

    if (isGroupMember(group, requester)) {
      res.status(400);
      throw new Error("User is already a member");
    }

    const pendingIds = (group.joinRequests || []).map(String);
    if (pendingIds.includes(String(requester))) {
      res.status(409);
      throw new Error("Join request already exists");
    }

    group.joinRequests = [...(group.joinRequests || []), String(requester)];
    await group.save();

    const io = getIo();
    io.to(`user:${group.createdBy}`).emit("group:join-requested", {
      groupId: group.groupId,
      userId: requester,
    });

    res.status(200).json({
      success: true,
      data: {
        groupId: group.groupId,
        userId: requester,
      },
      message: "Join request submitted",
    });
  } catch (error) {
    next(error);
  }
};

const cancelJoinRequest = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    const jr = (group.joinRequests || []).map(String);
    if (!jr.includes(String(userId))) {
      res.status(404);
      throw new Error("No join request found");
    }

    group.joinRequests = (group.joinRequests || []).filter(
      (id) => String(id) !== String(userId),
    );
    await group.save();

    res.status(200).json({
      success: true,
      data: { groupId },
      message: "Join request cancelled",
    });
  } catch (error) {
    next(error);
  }
};

const approveJoinRequest = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error("userId is required");
    }

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    assertGroupAdmin(group, req.user.userId, res);

    const jrApprove = (group.joinRequests || []).map(String);
    if (!jrApprove.includes(String(userId))) {
      res.status(404);
      throw new Error("Join request not found");
    }

    const uidApprove = String(userId).trim();
    if (!group.members.map(String).includes(uidApprove)) {
      group.members.push(uidApprove);
    }
    group.joinRequests = (group.joinRequests || []).filter(
      (idValue) => String(idValue) !== uidApprove,
    );
    await group.save();

    const io = getIo();
    for (const member of group.members) {
      io.to(`user:${member}`).emit("group:updated", {
        group: sanitizeGroup(group),
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeGroup(group),
      message: "Join request approved",
    });
  } catch (error) {
    next(error);
  }
};

const rejectJoinRequest = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error("userId is required");
    }

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    assertGroupAdmin(group, req.user.userId, res);

    const jrReject = (group.joinRequests || []).map(String);
    if (!jrReject.includes(String(userId))) {
      res.status(404);
      throw new Error("Join request not found");
    }

    const uidReject = String(userId).trim();
    group.joinRequests = (group.joinRequests || []).filter(
      (idValue) => String(idValue) !== uidReject,
    );
    await group.save();

    res.status(200).json({
      success: true,
      data: sanitizeGroup(group),
      message: "Join request rejected",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Send group join request (with GroupJoinRequest model)
const sendGroupJoinRequest = async (req, res, next) => {
  try {
    const userId = String(req.user.userId).trim();
    const username = req.user.username;
    const { groupId } = req.body;

    if (!groupId) {
      res.status(400);
      throw new Error("Group ID is required");
    }

    const GroupJoinRequest = require("../models/GroupJoinRequest");
    const group = await findGroup(groupId);

    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    const gid = group.groupId;

    if (isGroupMember(group, userId)) {
      res.status(400);
      throw new Error("Already a member of this group");
    }

    const existingPending = await GroupJoinRequest.findOne({
      userId,
      groupId: gid,
      status: "pending",
    });

    if (existingPending) {
      res.status(400);
      throw new Error("Join request already pending");
    }

    const previouslyRejected = await GroupJoinRequest.findOne({
      userId,
      groupId: gid,
      status: "rejected",
    });

    let joinRequest;

    if (previouslyRejected) {
      previouslyRejected.status = "pending";
      previouslyRejected.username = username;
      previouslyRejected.groupName = group.name;
      await previouslyRejected.save();
      joinRequest = previouslyRejected;
    } else {
      joinRequest = await GroupJoinRequest.create({
        userId,
        username,
        groupId: gid,
        groupName: group.name,
        status: "pending",
      });
    }

    const io = getIo();
    io.to(`user:${group.createdBy}`).emit("group:join-requested", {
      request: joinRequest,
    });

    const code = previouslyRejected ? 200 : 201;
    res.status(code).json({
      success: true,
      data: joinRequest,
      message: "Join request sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get pending group join requests for admin
const getPendingGroupJoinRequests = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const GroupJoinRequest = require("../models/GroupJoinRequest");

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    // Only group admin can view join requests
    assertGroupAdmin(group, req.user.userId, res);

    const pendingRequests = await GroupJoinRequest.find({
      groupId: group.groupId,
      status: "pending",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingRequests,
      message: "Pending join requests retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get sent group join requests (user's perspective)
const getUserGroupJoinRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const GroupJoinRequest = require("../models/GroupJoinRequest");

    // Get all join requests sent by the user
    const sentRequests = await GroupJoinRequest.find({
      userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sentRequests,
      message: "User group join requests retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Accept group join request
const acceptGroupJoinRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const GroupJoinRequest = require("../models/GroupJoinRequest");

    if (!requestId) {
      res.status(400);
      throw new Error("Request ID is required");
    }

    const joinRequest = await GroupJoinRequest.findById(requestId);

    if (!joinRequest) {
      res.status(404);
      throw new Error("Join request not found");
    }

    const group = await findGroup(joinRequest.groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    // Verify admin
    assertGroupAdmin(group, req.user.userId, res);

    if (joinRequest.status !== "pending") {
      res.status(400);
      throw new Error(`Request is already ${joinRequest.status}`);
    }

    const newMemberId = String(joinRequest.userId).trim();
    if (!group.members.map(String).includes(newMemberId)) {
      group.members.push(newMemberId);
    }
    group.joinRequests = (group.joinRequests || []).filter(
      (id) => String(id) !== newMemberId,
    );
    await group.save();

    joinRequest.status = "accepted";
    await joinRequest.save();

    const io = getIo();
    for (const m of group.members) {
      io.to(`user:${m}`).emit("group:updated", {
        group: sanitizeGroup(group),
      });
    }
    io.to(`user:${joinRequest.userId}`).emit("group:join-accepted", {
      groupId: group.groupId,
      groupName: group.name,
    });

    res.status(200).json({
      success: true,
      data: joinRequest,
      message: "Join request accepted",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Reject group join request
const rejectGroupJoinRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const GroupJoinRequest = require("../models/GroupJoinRequest");

    if (!requestId) {
      res.status(400);
      throw new Error("Request ID is required");
    }

    const joinRequest = await GroupJoinRequest.findById(requestId);

    if (!joinRequest) {
      res.status(404);
      throw new Error("Join request not found");
    }

    const group = await findGroup(joinRequest.groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    // Verify admin
    assertGroupAdmin(group, req.user.userId, res);

    if (joinRequest.status !== "pending") {
      res.status(400);
      throw new Error(`Request is already ${joinRequest.status}`);
    }

    joinRequest.status = "rejected";
    await joinRequest.save();

    const io = getIo();
    io.to(`user:${joinRequest.userId}`).emit("group:join-rejected", {
      groupId: group.groupId,
      groupName: group.name,
    });

    res.status(200).json({
      success: true,
      data: joinRequest,
      message: "Join request rejected",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Cancel own group join request
const cancelGroupJoinRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.body;
    const GroupJoinRequest = require("../models/GroupJoinRequest");

    if (!requestId) {
      res.status(400);
      throw new Error("Request ID is required");
    }

    const joinRequest = await GroupJoinRequest.findById(requestId);

    if (!joinRequest) {
      res.status(404);
      throw new Error("Join request not found");
    }

    // Verify user owns the request
    if (String(joinRequest.userId) !== String(userId)) {
      res.status(403);
      throw new Error("Can only cancel your own join requests");
    }

    if (joinRequest.status !== "pending") {
      res.status(400);
      throw new Error(`Cannot cancel ${joinRequest.status} request`);
    }

    await GroupJoinRequest.deleteOne({ _id: requestId });

    res.status(200).json({
      success: true,
      message: "Join request cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

const transferGroupAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { newAdminUserId } = req.body;

    if (!newAdminUserId) {
      res.status(400);
      throw new Error("newAdminUserId is required");
    }

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    assertGroupAdmin(group, req.user.userId, res);

    const nid = String(newAdminUserId).trim();
    if (!isGroupMember(group, nid)) {
      res.status(400);
      throw new Error("New admin must be an existing member");
    }

    if (String(group.createdBy) === nid) {
      res.status(400);
      throw new Error("That member is already the admin");
    }

    group.createdBy = nid;
    await group.save();

    const io = getIo();
    for (const m of group.members) {
      io.to(`user:${m}`).emit("group:updated", {
        group: sanitizeGroup(group),
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeGroup(group),
      message: "Ownership transferred successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get members of a group
const getGroupMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await findGroup(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    // Check if user is member
    if (!isGroupMember(group, req.user.userId)) {
      res.status(403);
      throw new Error("Not a member of this group");
    }

    // Fetch user details for all members
    const members = await User.find(
      { userId: { $in: group.members } },
      { userId: 1, username: 1, name: 1, email: 1, upiId: 1 },
    );

    // Create a map for quick lookup and merge with additional info
    const memberMap = {};
    members.forEach((member) => {
      const key = String(member.userId).trim();
      memberMap[key] = {
        userId: member.userId,
        username: member.username,
        name: member.name,
        email: member.email,
        upiId: member.upiId ? String(member.upiId).trim() : null,
        isAdmin: String(group.createdBy) === key,
      };
    });

    /** One row per `group.members` id — keep alignment even if User doc is missing. */
    const membersList = (group.members || []).map((uid) => {
      const id = String(uid).trim();
      const u = memberMap[id];
      if (u) return u;
      return {
        userId: id,
        username: null,
        name: "Unknown member",
        email: null,
        upiId: null,
        isAdmin: String(group.createdBy) === id,
      };
    });

    res.status(200).json({
      success: true,
      data: membersList,
      count: membersList.length,
      message: "Group members retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
