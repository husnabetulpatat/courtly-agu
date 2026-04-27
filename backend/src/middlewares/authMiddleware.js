const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        tennisLevel: true,
        hasRacket: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Not authorized, user not found or inactive"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid token"
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !["ADMIN", "COACH"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Admin or coach access required"
    });
  }

  next();
};

module.exports = {
  protect,
  requireAdmin
};
