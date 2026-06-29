const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: String,

    description: String,

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    dueDate: Date,

    estimatedEffort: String,

    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board"
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);