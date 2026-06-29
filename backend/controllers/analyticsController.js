const Task = require("../models/Task");
const Board = require("../models/Board");

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all boards owned by user
    const boards = await Board.find({ owner: userId });
    const boardIds = boards.map((b) => b._id);

    // Get all tasks across all boards
    const tasks = await Task.find({ owner: userId, board: { $in: boardIds } });

    const now = new Date();

    // Tasks by status
    const byStatus = [
      { name: "To Do",       value: tasks.filter((t) => t.status === "todo").length },
      { name: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length },
      { name: "Done",        value: tasks.filter((t) => t.status === "done").length },
    ];

    // Tasks by priority
    const byPriority = [
      { name: "High",   value: tasks.filter((t) => t.priority === "high").length },
      { name: "Medium", value: tasks.filter((t) => t.priority === "medium").length },
      { name: "Low",    value: tasks.filter((t) => t.priority === "low").length },
    ];

    // Overdue = dueDate in past and not done
    const overdueCount = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
    ).length;

    // Tasks per board (for bar chart)
    const perBoard = boards.map((b) => ({
      name: b.title.length > 16 ? b.title.slice(0, 16) + "…" : b.title,
      total: tasks.filter((t) => String(t.board) === String(b._id)).length,
      done:  tasks.filter((t) => String(t.board) === String(b._id) && t.status === "done").length,
    }));

    res.json({
      totalTasks: tasks.length,
      totalBoards: boards.length,
      overdueCount,
      byStatus,
      byPriority,
      perBoard,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
