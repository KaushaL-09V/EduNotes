// src/routes/transcriptRoutes.js
const express = require("express");
const {
  getTranscript,
  getVideoById,
} = require("../controllers/transcriptController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
// router.use(protect);

// POST /api/transcript/fetch - Fetch transcript from YouTube
router.post("/fetch", getTranscript);

// GET /api/transcript/:videoId - Get video by ID
router.get("/:videoId", getVideoById);

module.exports = router;
