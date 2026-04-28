const express = require("express");
const {
  getTournamentMatches,
  createTournamentMatch,
  updateTournamentMatch,
  deleteTournamentMatch
} = require("../controllers/tournamentController");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getTournamentMatches);
router.post("/", protect, requireAdmin, createTournamentMatch);
router.patch("/:id", protect, requireAdmin, updateTournamentMatch);
router.delete("/:id", protect, requireAdmin, deleteTournamentMatch);

module.exports = router;