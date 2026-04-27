const express = require("express");
const {
  getLessons,
  createLesson,
  applyToLesson,
  getMyLessonApplications,
  getLessonApplications,
  updateApplicationStatus
} = require("../controllers/lessonController");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getLessons);
router.get("/my-applications", protect, getMyLessonApplications);
router.post("/", protect, requireAdmin, createLesson);
router.post("/:id/apply", protect, applyToLesson);
router.get("/:id/applications", protect, requireAdmin, getLessonApplications);
router.patch("/applications/:applicationId/status", protect, requireAdmin, updateApplicationStatus);

module.exports = router;
