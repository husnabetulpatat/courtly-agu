const express = require("express");
const {
  getAdminUsers,
  updateAdminUser
} = require("../controllers/userController");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/admin/all", protect, requireAdmin, getAdminUsers);
router.patch("/admin/:id", protect, requireAdmin, updateAdminUser);

module.exports = router;
