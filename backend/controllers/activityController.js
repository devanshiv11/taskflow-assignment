const ActivityLog = require("../models/ActivityLog");
const Board = require("../models/Board");

// GET /api/activity?board=boardId
const getActivity = async (req, res) => {
  try {
    const { board } = req.query;
    if (!board) return res.status(400).json({ message: "Board ID required" });

    // Verify ownership
    const boardDoc = await Board.findOne({ _id: board, owner: req.user._id });
    if (!boardDoc) return res.status(404).json({ message: "Board not found" });

    const logs = await ActivityLog.find({ board })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "name");

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActivity };
