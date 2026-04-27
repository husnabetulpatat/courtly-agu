const express = require("express");
const {
  getAnnouncements,
  createAnnouncement
} = require("../controllers/announcementController");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getAnnouncements);
router.post("/", protect, requireAdmin, createAnnouncement);

module.exports = router;
