const validateUsername = (username) => {
  if (!username) return "Username is required";
  if (typeof username !== "string") return "Username must be a string";

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) return "Username must be at least 3 characters";
  if (trimmed.length > 30) return "Username must be at most 30 characters";
  if (!/^[a-z0-9_-]+$/.test(trimmed))
    return "Username can only contain letters, numbers, underscore, and hyphen";

  return null;
};

const validateEmail = (email) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

const validateGroupName = (name) => {
  if (!name) return "Group name is required";
  if (typeof name !== "string") return "Group name must be a string";
  if (name.trim().length === 0) return "Group name cannot be empty";
  if (name.length > 100) return "Group name must be at most 100 characters";
  return null;
};

const validateExpenseTitle = (title) => {
  if (!title) return "Expense title is required";
  if (typeof title !== "string") return "Title must be a string";
  if (title.trim().length === 0) return "Title cannot be empty";
  if (title.length > 200) return "Title must be at most 200 characters";
  return null;
};

const validateAmount = (amount) => {
  if (amount === undefined || amount === null) return "Amount is required";
  const num = Number(amount);
  if (isNaN(num)) return "Amount must be a valid number";
  if (num <= 0) return "Amount must be greater than zero";
  return null;
};

const validateUserId = (userId) => {
  if (!userId) return "User ID is required";
  if (!/^USR_[A-Z0-9]+$/.test(String(userId).trim()))
    return "Invalid user ID format";
  return null;
};

const validateGroupId = (groupId) => {
  if (!groupId) return "Group ID is required";
  if (typeof groupId !== "string") return "Group ID must be a string";
  return null;
};

const validateSplitType = (splitType) => {
  if (!splitType) return "Split type is required";
  if (!["equal", "exact", "percentage"].includes(splitType)) {
    return "Split type must be equal, exact, or percentage";
  }
  return null;
};

const validateParticipants = (participants) => {
  if (!Array.isArray(participants)) return "Participants must be an array";
  if (participants.length === 0) return "At least one participant is required";

  for (const p of participants) {
    if (!p.userId) return "Each participant must have userId";
    if (p.share === undefined || p.share === null)
      return "Each participant must have share";
    if (p.share < 0) return "Share cannot be negative";
  }

  return null;
};

module.exports = {
  validateUsername,
  validateEmail,
  validatePassword,
  validateGroupName,
  validateExpenseTitle,
  validateAmount,
  validateUserId,
  validateGroupId,
  validateSplitType,
  validateParticipants,
};
