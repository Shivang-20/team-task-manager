const express = require("express");
const { fetchProjects, addProject, fetchProjectById } = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, fetchProjects);
router.post("/", protect, requireRole("admin"), addProject);
router.get("/:id", protect, fetchProjectById);

module.exports = router;
