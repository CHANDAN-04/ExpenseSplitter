const crypto = require("crypto");

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20) || "group";

const randomSuffix = (length = 6) =>
  crypto.randomBytes(length).toString("hex").slice(0, length);

const generateUserId = () => `USR_${randomSuffix(12).toUpperCase()}`;
const generateGroupId = (name) =>
  `GRP_${toSlug(name)}_${randomSuffix(6).toUpperCase()}`;
const generateExpenseId = () => `EXP_${randomSuffix(12).toUpperCase()}`;
const generateSettlementId = () => `SET_${randomSuffix(12).toUpperCase()}`;
const generateSettlementRequestId = () =>
  `SRQ_${randomSuffix(12).toUpperCase()}`;
const generateNotificationId = () => `NOT_${randomSuffix(12).toUpperCase()}`;
const generateActivityId = () => `ACT_${randomSuffix(12).toUpperCase()}`;

module.exports = {
  generateUserId,
  generateGroupId,
  generateExpenseId,
  generateSettlementId,
  generateSettlementRequestId,
  generateNotificationId,
  generateActivityId,
};
