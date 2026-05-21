// checks that the logged-in user has one of the allowed roles
const requireRole = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ message: "You don't have permission to do that" });
  }
  next();
};

module.exports = { requireRole };
