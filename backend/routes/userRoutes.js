const express = require("express");
const { listUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, requireRole("admin"), listUsers);

module.exports = router;
