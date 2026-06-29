const express = require("express");
const { suggestEstimate, parseTask } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/suggest", protect, suggestEstimate);
router.post("/parse-task", protect, parseTask);

module.exports = router;
