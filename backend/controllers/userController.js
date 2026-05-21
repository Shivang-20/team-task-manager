const User = require("../models/User");
const wrap = require("../middleware/asyncHandler");

// GET /api/users — admin only, returns all users for the member picker
const listUsers = wrap(async (req, res) => {
  const users = await User.find().select("name email role").sort({ name: 1 });
  res.json(users);
});

module.exports = { listUsers };
