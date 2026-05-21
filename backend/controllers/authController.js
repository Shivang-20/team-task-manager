const jwt = require("jsonwebtoken");
const User = require("../models/User");
const wrap = require("../middleware/asyncHandler");

// helper to sign a JWT for a given user id
function makeToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

// POST /api/auth/signup
const signup = wrap(async (req, res) => {
  const { name, email, password, role } = req.body;

  const trimmedName = String(name || "").trim();
  const trimmedEmail = String(email || "").trim().toLowerCase();
  const trimmedPassword = String(password || "");

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (trimmedPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const taken = await User.findOne({ email: trimmedEmail });
  if (taken) {
    res.status(409);
    throw new Error("An account with that email already exists");
  }

  // only "admin" role gets elevated access, everything else becomes member
  const assignedRole = role === "admin" ? "admin" : "member";

  const newUser = await User.create({
    name: trimmedName,
    email: trimmedEmail,
    password: trimmedPassword,
    role: assignedRole
  });

  res.status(201).json({
    message: "Account created successfully",
    token: makeToken(newUser._id),
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// POST /api/auth/login
const login = wrap(async (req, res) => {
  const { email, password } = req.body;
  const trimmedEmail = String(email || "").trim().toLowerCase();

  if (!trimmedEmail || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: trimmedEmail }).select("+password");

  if (!user || !(await user.checkPassword(password))) {
    res.status(401);
    throw new Error("Wrong email or password");
  }

  res.json({
    message: "Logged in successfully",
    token: makeToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = { signup, login };
