// src/models/videoModel.js
import mongoose from 'mongoose';
const videoSchema = new mongoose.Schema({
    videoId: {
        type: String,
        required: true,
        unique: true
    },
    url: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    duration: {
        type: String
    },
    channelName: {
        type: String
    },
    transcript: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'en'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
videoSchema.index({ videoId: 1, uploadedBy: 1 });

// module.exports = mongoose.model('Video', videoSchema);
export default mongoose.model('Video', videoSchema);