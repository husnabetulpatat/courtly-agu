const express = require("express");
const {
  getAnnouncements,
  getAdminAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} = require("../controllers/announcementController");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getAnnouncements);
router.get("/admin/all", protect, requireAdmin, getAdminAnnouncements);
router.post("/", protect, requireAdmin, createAnnouncement);
router.delete("/:id", protect, requireAdmin, deleteAnnouncement);

module.exports = router;