const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    title: String,

    description: String,

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board", boardSchema);