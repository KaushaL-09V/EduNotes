import express from 'express';
import { getTranscript, getVideoById } from '../controllers/transcriptController.mjs';

const router = express.Router();

/**
 * @route   POST /api/transcript/fetch
 * @desc    Fetch transcript from YouTube video
 * @access  Private
 */
router.post('/fetch', getTranscript);

/**
 * @route   GET /api/transcript/:videoId
 * @desc    Get video by ID
 * @access  Private
 */
router.get('/:videoId', getVideoById);

export default router;