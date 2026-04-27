const express = require("express");
const {
  getCourts,
  createCourt,
  updateCourt
} = require("../controllers/courtController");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getCourts);
router.post("/", protect, requireAdmin, createCourt);
router.patch("/:id", protect, requireAdmin, updateCourt);

module.exports = router;
