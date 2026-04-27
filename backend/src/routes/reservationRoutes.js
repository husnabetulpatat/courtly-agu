const express = require("express");
const {
  getReservations,
  getMyReservations,
  createReservation,
  cancelReservation,
  updateReservationStatus
} = require("../controllers/reservationController");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getReservations);
router.get("/my", protect, getMyReservations);
router.post("/", protect, createReservation);
router.patch("/:id/cancel", protect, cancelReservation);
router.patch("/:id/status", protect, requireAdmin, updateReservationStatus);

module.exports = router;
