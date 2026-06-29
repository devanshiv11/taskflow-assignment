const express = require("express");
const { searchTasks, getTasks, createTask, updateTask, deleteTask } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);

// search must be before /:id
router.get("/search", searchTasks);
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
