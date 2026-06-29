const Task = require("../models/Task");
const Board = require("../models/Board");
const logActivity = require("../utils/logActivity");

// GET /api/tasks/search?q=...&priority=...&status=...
const searchTasks = async (req, res) => {
  try {
    const { q, priority, status } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ message: "Query is required" });

    const filter = {
      owner: req.user._id,
      $or: [
        { title: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
      ],
    };
    if (priority && priority !== "all") filter.priority = priority;
    if (status && status !== "all") filter.status = status;

    const tasks = await Task.find(filter)
      .populate("board", "title")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tasks?board=boardId&status=todo&page=1&limit=10
const getTasks = async (req, res) => {
  try {
    const { board, status, page = 1, limit = 10 } = req.query;
    if (!board) return res.status(400).json({ message: "Board ID required" });
    const boardDoc = await Board.findOne({ _id: board, owner: req.user._id });
    if (!boardDoc) return res.status(404).json({ message: "Board not found" });

    const filter = { board, owner: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + tasks.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, estimatedEffort, board } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });
    if (!board) return res.status(400).json({ message: "Board ID is required" });

    const boardDoc = await Board.findOne({ _id: board, owner: req.user._id });
    if (!boardDoc) return res.status(404).json({ message: "Board not found" });

    const validStatuses = ["todo", "in-progress", "done"];
    const validPriorities = ["low", "medium", "high"];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });
    if (priority && !validPriorities.includes(priority)) return res.status(400).json({ message: "Invalid priority" });

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "todo",
      priority: priority || "medium",
      dueDate: dueDate || null,
      estimatedEffort: estimatedEffort || "",
      board,
      owner: req.user._id,
    });

    logActivity({ board, task: task._id, user: req.user._id, action: "created", detail: `Created "${task.title}"` });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const { title, description, status, priority, dueDate, estimatedEffort } = req.body;
    const validStatuses = ["todo", "in-progress", "done"];
    const validPriorities = ["low", "medium", "high"];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });
    if (priority && !validPriorities.includes(priority)) return res.status(400).json({ message: "Invalid priority" });

    const oldStatus = task.status;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedEffort !== undefined) task.estimatedEffort = estimatedEffort;

    await task.save();

    // Determine what happened for the log
    const statusLabels = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
    if (status && status !== oldStatus) {
      const action = status === "done" ? "completed" : "moved";
      const detail = `Moved "${task.title}" from ${statusLabels[oldStatus]} → ${statusLabels[status]}`;
      logActivity({ board: task.board, task: task._id, user: req.user._id, action, detail });
    } else {
      logActivity({ board: task.board, task: task._id, user: req.user._id, action: "updated", detail: `Updated "${task.title}"` });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    logActivity({ board: task.board, task: task._id, user: req.user._id, action: "deleted", detail: `Deleted "${task.title}"` });

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { searchTasks, getTasks, createTask, updateTask, deleteTask };
