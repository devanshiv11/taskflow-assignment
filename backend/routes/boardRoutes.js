const express = require("express");
const { getBoards, createBoard, updateBoard, deleteBoard } = require("../controllers/boardController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getBoards);
router.post("/", createBoard);
router.put("/:id", updateBoard);
router.delete("/:id", deleteBoard);

module.exports = router;
