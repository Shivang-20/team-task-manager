const handle404 = (req, res) => {
  res.status(404).json({ message: `No route found for ${req.method} ${req.originalUrl}` });
};

const handleError = (err, req, res, next) => {
  const code = res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;
  res.status(code).json({
    message: err.message || "Something went wrong on the server",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
};

module.exports = { handle404, handleError };
