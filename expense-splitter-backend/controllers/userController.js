const User = require("../models/User");
const { sanitizeUser } = require("../utils/formatters");
const { validateUsername } = require("../utils/validators");
const notificationService = require("../services/notificationService");

const userPreview = (u) =>
  u
    ? {
        userId: u.userId,
        username: u.username,
        name: u.name,
      }
    : null;

async function enrichFriendRequestsWithUsers(requestDocs) {
  if (!requestDocs?.length) return [];
  const rows = requestDocs.map((d) => (d.toObject ? d.toObject() : { ...d }));
  const ids = new Set();
  rows.forEach((o) => {
    ids.add(String(o.senderId));
    ids.add(String(o.recipientId));
  });
  const users = await User.find({
    userId: { $in: [...ids] },
  }).select("userId username name");
  const byId = {};
  users.forEach((u) => {
    byId[String(u.userId)] = userPreview(u);
  });
  return rows.map((o) => ({
    ...o,
    senderUser:
      byId[String(o.senderId)] ||
      userPreview({
        userId: String(o.senderId),
        username: o.senderUsername,
      }),
    recipientUser:
      byId[String(o.recipientId)] ||
      userPreview({
        userId: String(o.recipientId),
        username: o.recipientUsername,
      }),
  }));
}

// Search users by name or username
const searchUsers = async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(200).json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password -_id -__v")
      .limit(25)
      .sort({ username: 1 });

    return res.status(200).json({
      success: true,
      data: users.map(sanitizeUser),
      message: "Users found",
    });
  } catch (error) {
    return next(error);
  }
};

const buildPublicProfile = (targetUser, viewerUser) => {
  const isSelf = String(viewerUser.userId) === String(targetUser.userId);
  const friendIds = (viewerUser.friends || []).map(String);
  const isFriend = friendIds.includes(String(targetUser.userId));

  const profile = {
    userId: targetUser.userId,
    username: targetUser.username,
    name: targetUser.name,
  };

  if (isSelf || isFriend) {
    profile.email = targetUser.email;
  }

  return profile;
};

const getRelationship = async (viewerUser, targetUser) => {
  const vid = String(viewerUser.userId);
  const tid = String(targetUser.userId);

  if (vid === tid) {
    return { relationship: "self", pendingRequestId: null };
  }

  const friendIds = (viewerUser.friends || []).map(String);
  if (friendIds.includes(tid)) {
    return { relationship: "friends", pendingRequestId: null };
  }

  const FriendRequest = require("../models/FriendRequest");

  const sentPending = await FriendRequest.findOne({
    senderId: vid,
    recipientId: tid,
    status: "pending",
  }).sort({ createdAt: -1 });

  if (sentPending) {
    return {
      relationship: "request_sent",
      pendingRequestId: String(sentPending._id),
    };
  }

  const receivedPending = await FriendRequest.findOne({
    senderId: tid,
    recipientId: vid,
    status: "pending",
  }).sort({ createdAt: -1 });

  if (receivedPending) {
    return {
      relationship: "request_received",
      pendingRequestId: String(receivedPending._id),
    };
  }

  return { relationship: "none", pendingRequestId: null };
};

const getProfileWithRelationship = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!username) {
      res.status(400);
      throw new Error("Username is required");
    }

    const normalized = String(username).toLowerCase().trim();
    const targetUser = await User.findOne({ username: normalized }).select(
      "-password -refreshTokens",
    );

    if (!targetUser) {
      res.status(404);
      throw new Error("User not found");
    }

    const viewerUser = await User.findOne({ userId: req.user.userId }).select(
      "-password -refreshTokens",
    );

    if (!viewerUser) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const profile = buildPublicProfile(targetUser, viewerUser);
    const { relationship, pendingRequestId } = await getRelationship(
      viewerUser,
      targetUser,
    );

    return res.status(200).json({
      success: true,
      data: {
        profile,
        relationship,
        pendingRequestId,
      },
      message: "User profile retrieved",
    });
  } catch (error) {
    return next(error);
  }
};

const getFriendRequestsSummary = async (req, res, next) => {
  try {
    const userId = String(req.user.userId);
    const FriendRequest = require("../models/FriendRequest");

    const [sentDocs, receivedDocs] = await Promise.all([
      FriendRequest.find({ senderId: userId, status: "pending" }).sort({
        createdAt: -1,
      }),
      FriendRequest.find({ recipientId: userId, status: "pending" }).sort({
        createdAt: -1,
      }),
    ]);

    const [sent, received] = await Promise.all([
      enrichFriendRequestsWithUsers(sentDocs),
      enrichFriendRequestsWithUsers(receivedDocs),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        sent,
        received,
        pendingIncomingCount: received.length,
      },
      message: "Friend requests retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const respondFriendRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      res.status(400);
      throw new Error("requestId and action are required");
    }

    if (action === "accept") {
      req.body = { requestId };
      return acceptFriendRequest(req, res, next);
    }

    if (action === "reject") {
      req.body = { requestId };
      return rejectFriendRequest(req, res, next);
    }

    res.status(400);
    throw new Error("action must be accept or reject");
  } catch (error) {
    return next(error);
  }
};

// Update user profile (current user)
const updateProfile = async (req, res, next) => {
  try {
    const { name, username, upiId } = req.body;
    const userId = req.user.userId;

    const updates = {};

    if (upiId !== undefined && upiId !== null) {
      if (typeof upiId !== "string") {
        res.status(400);
        throw new Error("UPI ID must be a string");
      }
      const trimmed = upiId.trim();
      if (trimmed.length > 100) {
        res.status(400);
        throw new Error("UPI ID must be at most 100 characters");
      }
      updates.upiId = trimmed.length ? trimmed : null;
    }

    if (name) {
      if (typeof name !== "string" || name.trim().length === 0) {
        res.status(400);
        throw new Error("Name must be a non-empty string");
      }
      if (name.trim().length > 100) {
        res.status(400);
        throw new Error("Name must be at most 100 characters");
      }
      updates.name = name.trim();
    }

    if (username) {
      const error = validateUsername(username);
      if (error) {
        res.status(400);
        throw new Error(error);
      }

      const normalizedUsername = username.toLowerCase().trim();
      const normalizedCurrentUsername = req.user.username.toLowerCase().trim();

      // Only check for uniqueness if changing username
      if (normalizedUsername !== normalizedCurrentUsername) {
        const existingUsername = await User.findOne({
          username: normalizedUsername,
        });
        if (existingUsername) {
          res.status(409);
          throw new Error("Username already taken");
        }
      }

      updates.username = normalizedUsername;
    }

    const user = await User.findOneAndUpdate({ userId }, updates, {
      new: true,
    }).select("-password -_id -__v");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
      message: "Profile updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Send friend request
const sendFriendRequest = async (req, res, next) => {
  try {
    const { username } = req.body;
    const senderId = String(req.user.userId);
    const senderUsername = req.user.username;

    if (!username) {
      res.status(400);
      throw new Error("Username is required");
    }

    const normalizedUsername = String(username).toLowerCase().trim();
    const FriendRequest = require("../models/FriendRequest");

    const recipient = await User.findOne({
      username: normalizedUsername,
    }).select("userId username name");

    if (!recipient) {
      res.status(404);
      throw new Error("User not found");
    }

    const recipientId = String(recipient.userId);

    if (recipientId === senderId) {
      res.status(400);
      throw new Error("Cannot send friend request to yourself");
    }

    const sender = await User.findOne({ userId: senderId });
    const senderFriends = (sender.friends || []).map(String);
    if (senderFriends.includes(recipientId)) {
      res.status(400);
      throw new Error("Already friends with this user");
    }

    const existingPending = await FriendRequest.findOne({
      $or: [
        { senderId, recipientId, status: "pending" },
        { senderId: recipientId, recipientId: senderId, status: "pending" },
      ],
    });

    if (existingPending) {
      res.status(400);
      throw new Error("Friend request already exists");
    }

    const previouslyRejected = await FriendRequest.findOne({
      senderId,
      recipientId,
      status: "rejected",
    });

    let friendRequest;
    if (previouslyRejected) {
      previouslyRejected.status = "pending";
      previouslyRejected.senderUsername = senderUsername;
      previouslyRejected.recipientUsername = recipient.username;
      await previouslyRejected.save();
      friendRequest = previouslyRejected;
    } else {
      friendRequest = await FriendRequest.create({
        senderId,
        senderUsername,
        recipientId,
        recipientUsername: recipient.username,
        status: "pending",
      });
    }

    await notificationService.createNotification(
      recipientId,
      "friend_request",
      `Friend request from @${senderUsername}`,
      `@${senderUsername} wants to connect with you on Splitter.`,
      {
        friendRequestId: String(friendRequest._id),
        fromUserId: senderId,
        userId: senderId,
      },
    );

    const statusCode = previouslyRejected ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      data: friendRequest,
      message: "Friend request sent successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Accept friend request
const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.userId;
    const FriendRequest = require("../models/FriendRequest");

    if (!requestId) {
      res.status(400);
      throw new Error("Request ID is required");
    }

    // Find friend request
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      res.status(404);
      throw new Error("Friend request not found");
    }

    if (String(friendRequest.recipientId) !== String(userId)) {
      res.status(403);
      throw new Error("You can only accept requests sent to you");
    }

    if (friendRequest.status !== "pending") {
      res.status(400);
      throw new Error(`Request is already ${friendRequest.status}`);
    }

    // Update request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    const sender = await User.findOne({ userId: friendRequest.senderId });
    const recipient = await User.findOne({ userId: friendRequest.recipientId });

    const rid = String(friendRequest.recipientId);
    const sid = String(friendRequest.senderId);
    const senderFriends = (sender.friends || []).map(String);
    const recipientFriends = (recipient.friends || []).map(String);

    if (!senderFriends.includes(rid)) {
      sender.friends.push(rid);
    }
    if (!recipientFriends.includes(sid)) {
      recipient.friends.push(sid);
    }

    await sender.save();
    await recipient.save();

    await notificationService.createNotification(
      sid,
      "friend_accepted",
      `@${recipient.username} accepted your request`,
      `${recipient.name || recipient.username} accepted your friend request.`,
      {
        friendRequestId: String(friendRequest._id),
        userId: rid,
      },
    );

    return res.status(200).json({
      success: true,
      data: friendRequest,
      message: "Friend request accepted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Reject friend request
const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.userId;
    const FriendRequest = require("../models/FriendRequest");

    if (!requestId) {
      res.status(400);
      throw new Error("Request ID is required");
    }

    // Find friend request
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      res.status(404);
      throw new Error("Friend request not found");
    }

    if (String(friendRequest.recipientId) !== String(userId)) {
      res.status(403);
      throw new Error("You can only reject requests sent to you");
    }

    if (friendRequest.status !== "pending") {
      res.status(400);
      throw new Error(`Request is already ${friendRequest.status}`);
    }

    // Update request status to rejected
    friendRequest.status = "rejected";
    await friendRequest.save();

    return res.status(200).json({
      success: true,
      data: friendRequest,
      message: "Friend request rejected successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Get pending friend requests
const getPendingRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const FriendRequest = require("../models/FriendRequest");

    // Get all pending requests for current user
    const requests = await FriendRequest.find({
      recipientId: userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
      message: "Pending friend requests retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Remove friend by username
const removeFriend = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;

    if (!username) {
      res.status(400);
      throw new Error("Username is required");
    }

    const normalizedUsername = String(username).toLowerCase().trim();

    // Find friend by username
    const friend = await User.findOne({ username: normalizedUsername }).select(
      "userId",
    );

    if (!friend) {
      res.status(404);
      throw new Error("User not found");
    }

    const user = await User.findOne({ userId: currentUserId });
    const friendUser = await User.findOne({ userId: friend.userId });

    if (!friendUser) {
      res.status(404);
      throw new Error("User not found");
    }

    user.friends = (user.friends || []).filter(
      (id) => String(id) !== String(friend.userId),
    );
    friendUser.friends = (friendUser.friends || []).filter(
      (id) => String(id) !== String(currentUserId),
    );

    await Promise.all([user.save(), friendUser.save()]);

    const updatedUser = await User.findOne({ userId: currentUserId }).select(
      "-password -_id -__v",
    );

    return res.status(200).json({
      success: true,
      data: sanitizeUser(updatedUser),
      message: "Friend removed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Get sent friend requests (with status "requested")
const getSentFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const FriendRequest = require("../models/FriendRequest");

    // Get all requests sent by current user
    const sentRequests = await FriendRequest.find({
      senderId: userId,
    }).sort({ createdAt: -1 });

    // Format with "requested" status for UI
    const formattedRequests = sentRequests.map((req) => ({
      ...req.toObject(),
      userStatus: "requested", // Current user's perspective
    }));

    return res.status(200).json({
      success: true,
      data: formattedRequests,
      message: "Sent friend requests retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Get received friend requests (pending)
const getReceivedFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const FriendRequest = require("../models/FriendRequest");

    // Get all pending requests received by current user
    const receivedRequests = await FriendRequest.find({
      recipientId: userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: receivedRequests,
      message: "Received friend requests retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// Get all friends (accepted relationships)
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get current user's friends
    const user = await User.findOne({ userId });

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Get friend details
    const friends = await User.find(
      { userId: { $in: user.friends } },
      { password: 0, refreshTokens: 0 },
    );

    return res.status(200).json({
      success: true,
      data: friends.map(sanitizeUser),
      message: "Friends retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
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
};
