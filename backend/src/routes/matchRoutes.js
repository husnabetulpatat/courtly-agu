const express = require("express");
const {
  getMatchPosts,
  getMyMatchPosts,
  getMyMatchRequests,
  createMatchPost,
  cancelMatchPost,
  requestToJoinMatch,
  getMatchRequests,
  updateMatchRequestStatus,
  getMessages,
  sendMessage
} = require("../controllers/matchController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getMatchPosts);
router.get("/my", protect, getMyMatchPosts);
router.get("/my-requests", protect, getMyMatchRequests);
router.post("/", protect, createMatchPost);
router.patch("/:id/cancel", protect, cancelMatchPost);
router.post("/:id/requests", protect, requestToJoinMatch);
router.get("/:id/requests", protect, getMatchRequests);
router.patch("/requests/:requestId/status", protect, updateMatchRequestStatus);
router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);

module.exports = router;