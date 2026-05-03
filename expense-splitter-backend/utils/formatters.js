const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    userId: user.userId,
    username: user.username,
    name: user.name,
    email: user.email,
    upiId: user.upiId || null,
    friends: user.friends || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const sanitizeGroup = (group) => {
  if (!group) return null;
  const members = Array.isArray(group.members) ? group.members : [];
  return {
    groupId: group.groupId,
    name: group.name,
    members,
    /** Explicit count — clients often expect this (lists use memberCount; arrays may be omitted in lean projections). */
    memberCount: members.length,
    createdBy: group.createdBy,
    joinRequests: group.joinRequests || [],
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
};

const sanitizeExpense = (expense) => {
  if (!expense) return null;
  return {
    expenseId: expense.expenseId,
    title: expense.title,
    amount: expense.amount,
    paidBy: expense.paidBy,
    participants: (expense.participants || []).map((p) => ({
      userId: p.userId,
      share: p.share,
      paid: p.paid,
    })),
    groupId: expense.groupId,
    category: expense.category,
    billImageUrl: expense.billImageUrl,
    splitType: expense.splitType,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
};

const sanitizeNotification = (notification) => {
  if (!notification) return null;
  return {
    notificationId: notification.notificationId,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedData: notification.relatedData,
    read: notification.read,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};

const sanitizeActivityLog = (activity) => {
  if (!activity) return null;
  return {
    activityId: activity.activityId,
    groupId: activity.groupId,
    userId: activity.userId,
    type: activity.type,
    description: activity.description,
    relatedData: activity.relatedData,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
};

module.exports = {
  sanitizeUser,
  sanitizeGroup,
  sanitizeExpense,
  sanitizeNotification,
  sanitizeActivityLog,
};
