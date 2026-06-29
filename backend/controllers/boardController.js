const Board = require("../models/Board");
const Task = require("../models/Task");

// GET /api/boards
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/boards
const createBoard = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    const board = await Board.create({
      title: title.trim(),
      description: description?.trim() || "",
      owner: req.user._id,
    });
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/boards/:id
const updateBoard = async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, owner: req.user._id });
    if (!board) return res.status(404).json({ message: "Board not found" });
    const { title, description } = req.body;
    if (title !== undefined) board.title = title.trim();
    if (description !== undefined) board.description = description.trim();
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/boards/:id
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, owner: req.user._id });
    if (!board) return res.status(404).json({ message: "Board not found" });
    await Task.deleteMany({ board: board._id });
    await board.deleteOne();
    res.json({ message: "Board deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
