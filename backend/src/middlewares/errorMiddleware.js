const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`
  });
};

const errorHandler = (error, req, res, next) => {
  console.error(error);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: error.message || "Server error"
  });
};

module.exports = {
  notFound,
  errorHandler
};
