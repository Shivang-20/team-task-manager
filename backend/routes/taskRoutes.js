const express = require("express");
const {
  createTask,
  getTasksForProject,
  editTask,
  removeTask,
  getDashboardSummary
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// dashboard stats route needs to come before /:id or express will try to match "dashboard" as an id
router.get("/dashboard/stats", protect, getDashboardSummary);
router.post("/", protect, requireRole("admin"), createTask);
router.get("/project/:projectId", protect, getTasksForProject);
router.put("/:id", protect, editTask);
router.delete("/:id", protect, requireRole("admin"), removeTask);

module.exports = router;
