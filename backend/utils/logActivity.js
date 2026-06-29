const ActivityLog = require("../models/ActivityLog");

/**
 * logActivity({ board, task, user, action, detail })
 * Fire-and-forget — never throws, so it never breaks the main request.
 */
const logActivity = async ({ board, task, user, action, detail = "" }) => {
  try {
    await ActivityLog.create({ board, task, user, action, detail });
  } catch {
    // silently ignore — logging must never break core operations
  }
};

module.exports = logActivity;
