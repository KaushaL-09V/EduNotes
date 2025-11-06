// src/controllers/transcriptController.js
const transcriptService = require('../services/transcriptService');
const Video = require('../models/videoModel');

/**
 * @desc    Fetch transcript from YouTube video
 * @route   POST /api/transcript/fetch
 * @access  Private
 */
const getTranscript = async (req, res, next) => {
  try {
    const { videoUrl, title } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Video URL is required' });
    }

    if (!transcriptService.isValidYouTubeUrl(videoUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
    }

    // Optional: extract videoId early and log it
    const videoId = transcriptService.extractVideoId(videoUrl);
    console.log('Fetching transcript for videoId:', videoId);

    // Fetch transcript (catch expected "no transcript" scenario)
    let videoData;
    try {
      videoData = await transcriptService.fetchTranscript(videoUrl);
      console.log('Fetching transcript video data:', videoData);
    } catch (err) {
      console.error('fetchTranscript error:', err && err.message ? err.message : err);

      // If the service intentionally throws "No transcript available", return 404 with a helpful message
      if (err && /no transcript/i.test(err.message || '')) {
        return res.status(404).json({
          success: false,
          message: `Failed to fetch transcript: ${err.message}`
        });
      }

      // otherwise propagate to central error handler
      throw err;
    }

    if (!videoData || !videoData.videoId || !videoData.transcript) {
      console.error('Unexpected videoData:', videoData);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transcript: unexpected response from transcript service'
      });
    }

    // Check if video already exists
    let video = await Video.findOne({ videoId: videoData.videoId });

    if (!video) {
      video = await Video.create({
        videoId: videoData.videoId,
        url: videoUrl,
        title: title || `Video ${videoData.videoId}`,
        transcript: videoData.transcript,
        uploadedBy: req.user?.id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transcript fetched successfully',
      data: {
        videoId: video.videoId,
        title: video.title,
        transcript: video.transcript,
        transcriptLength: video.transcript.length,
        _id: video._id
      }
    });
  } catch (error) {
    console.error('Transcript fetch error:', error && error.message ? error.message : error);
    next(error);
  }
};

/**
 * @desc    Get video by ID
 * @route   GET /api/transcript/:videoId
 * @access  Private
 */
const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { video }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTranscript,
  getVideoById
};