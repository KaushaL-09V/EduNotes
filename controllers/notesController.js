// src/controllers/notesController.js
const Note = require("../models/noteModel");
const Video = require("../models/videoModel");
const User = require("../models/userModel");
const aiService = require("../services/aiService");

/**
 * @desc    Generate notes from transcript using AI
 * @route   POST /api/notes/generate
 * @access  Private
 */
const generateNotes = async (req, res, next) => {
  try {
    const { transcript, title, videoId } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: "Transcript is required",
      });
    }

    // Generate notes using AI
    const generatedNotes = await aiService.generateNotes(transcript, title);

    res.status(200).json({
      success: true,
      message: "Notes generated successfully",
      data: {
        notes: generatedNotes,
      },
    });
  } catch (error) {
    console.error("Generate notes error:", error.message);
    next(error);
  }
};

/**
 * @desc    Save generated notes
 * @route   POST /api/notes/save
 * @access  Private
 */
const saveNote = async (req, res, next) => {
  try {
    const { videoId, title, content, structuredNotes, tags, folder } = req.body;

    if (!videoId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "Video ID, title, and content are required",
      });
    }

    // Verify video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Create note
    const note = await Note.create({
      user: req.user.id,
      video: videoId,
      title,
      content,
      structuredNotes: structuredNotes || {},
      tags: tags || [],
      folder: folder || "General",
    });

    // Add note to user's saved notes
    await User.findByIdAndUpdate(req.user.id, {
      $push: { savedNotes: note._id },
    });

    const populatedNote = await Note.findById(note._id).populate(
      "video",
      "title url videoId"
    );

    res.status(201).json({
      success: true,
      message: "Note saved successfully",
      data: { note: populatedNote },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all notes for logged-in user
 * @route   GET /api/notes
 * @access  Private
 */
const getUserNotes = async (req, res, next) => {
  try {
    const { folder, tags, search } = req.query;

    // Build query
    const query = { user: req.user.id };

    if (folder) {
      query.folder = folder;
    }

    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const notes = await Note.find(query)
      .populate("video", "title url videoId")
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single note by ID
 * @route   GET /api/notes/:id
 * @access  Private
 */
const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "video",
      "title url videoId transcript"
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if note belongs to user
    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this note",
      });
    }

    res.status(200).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update note (highlight, translate, etc.)
 * @route   PATCH /api/notes/:id
 * @access  Private
 */
const updateNote = async (req, res, next) => {
  try {
    let note = await Note.findById(req.params.id);

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
        message: "Not authorized to update this note",
      });
    }

    // Update note
    note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("video", "title url videoId");

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

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
        message: "Not authorized to delete this note",
      });
    }

    await note.deleteOne();

    // Remove from user's saved notes
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { savedNotes: note._id },
    });

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add highlight to note
 * @route   POST /api/notes/:id/highlight
 * @access  Private
 */
const addHighlight = async (req, res, next) => {
  try {
    const { text, color, position } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    note.highlights.push({ text, color, position });
    await note.save();

    res.status(200).json({
      success: true,
      message: "Highlight added successfully",
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateNotes,
  saveNote,
  getUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
  addHighlight,
};
