// src/routes/noteRoutes.js
const express = require("express");
const {
  generateNotes,
  saveNote,
  getUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
  addHighlight,
} = require("../controllers/notesController");
const { protect } = require("../middleware/authMiddleware");
const {
  generatePDF,
  generateTXT,
  generateMarkdown,
} = require("../services/pdfGenerator");
const Note = require("../models/noteModel");

const router = express.Router();

// All routes are protected
router.use(protect);

// POST /api/notes/generate - Generate notes from transcript
router.post("/generate", generateNotes);

// POST /api/notes/save - Save generated notes
router.post("/save", saveNote);

// GET /api/notes - Get all user notes (with optional filters)
router.get("/", getUserNotes);

// GET /api/notes/:id - Get single note by ID
router.get("/:id", getNoteById);

// PATCH /api/notes/:id - Update note
router.patch("/:id", updateNote);

// DELETE /api/notes/:id - Delete note
router.delete("/:id", deleteNote);

// POST /api/notes/:id/highlight - Add highlight to note
router.post("/:id/highlight", addHighlight);

// GET /api/notes/:id/export/:format - Export note as PDF/TXT/MD
router.get("/:id/export/:format", async (req, res, next) => {
  try {
    const { id, format } = req.params;

    const note = await Note.findById(id).populate("video", "title url");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check authorization
    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const filename = `${note.title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}`;

    switch (format.toLowerCase()) {
      case "pdf":
        const pdfBuffer = await generatePDF(note);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.pdf"`
        );
        res.send(pdfBuffer);
        break;

      case "txt":
        const txtContent = generateTXT(note);
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.txt"`
        );
        res.send(txtContent);
        break;

      case "md":
      case "markdown":
        const mdContent = generateMarkdown(note);
        res.setHeader("Content-Type", "text/markdown");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.md"`
        );
        res.send(mdContent);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid format. Use pdf, txt, or md",
        });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
