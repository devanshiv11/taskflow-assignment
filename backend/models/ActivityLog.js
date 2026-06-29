const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    task:  { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["created", "updated", "deleted", "moved", "completed"],
      required: true,
    },
    detail: { type: String, default: "" }, // human-readable detail
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
