// src/controllers/transcriptController.js
import transcriptService from "../services/transcriptService.mjs";
import Video from "../models/videoModel.mjs";

/**
 * @desc    Fetch transcript from YouTube video
 * @route   POST /api/transcript/fetch
 * @access  Private
 */
export const getTranscript = async (req, res, next) => {
  try {
    const { videoUrl, title } = req.body;

    if (!videoUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Video URL is required" });
    }

    if (!transcriptService.isValidYouTubeUrl(videoUrl)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid YouTube URL" });
    }

    const videoId = transcriptService.extractVideoId(videoUrl);
    console.log("Fetching transcript for videoId:", videoId);

    let videoData;
    try {
      videoData = await transcriptService.fetchT(videoUrl);
      console.log("Fetching transcript video data:", videoData);
    } catch (err) {
      console.error(
        "fetchTranscript error:",
        err && err.message ? err.message : err
      );

      if (err && /no transcript/i.test(err.message || "")) {
        return res.status(404).json({
          success: false,
          message: `Failed to fetch transcript: ${err.message}`,
        });
      }

      throw err;
    }

    if (!videoData || !videoData.videoId || !videoData.transcript) {
      console.error("Unexpected videoData:", videoData);
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch transcript: unexpected response from transcript service",
      });
    }

    let video = await Video.findOne({ videoId: videoData.videoId });
    console.log("Existing video found:", video);
    if (!video) {
      video = await Video.create({
        videoId: videoData.videoId,
        url: videoUrl,
        title: title || `Video ${videoData.videoId}`,
        transcript: videoData.transcript,
        uploadedBy: req.user?.id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Transcript fetched successfully",
      data: {
        // videoId: video.videoId,
        // title: video.title,
        transcript: videoData,
        // transcriptLength: video.transcript.length,
        // _id: video._id,
      },
    });
  } catch (error) {
    console.error(
      "Transcript fetch error:",
      error && error.message ? error.message : error
    );
    next(error);
  }
};

/**
 * @desc    Get video by ID
 * @route   GET /api/transcript/:videoId
 * @access  Private
 */
export const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};
