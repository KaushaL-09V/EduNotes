// src/models/noteModel.js
import mongoose from 'mongoose';
const highlightSchema = new mongoose.Schema({
    text: String,
    color: {
        type: String,
        enum: ['yellow', 'green', 'blue', 'pink', 'orange'],
        default: 'yellow'
    },
    position: {
        start: Number,
        end: Number
    }
}, { _id: false });

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    structuredNotes: {
        summary: String,
        keyPoints: [String],
        sections: [{
            heading: String,
            content: String
        }]
    },
    highlights: [highlightSchema],
    tags: [{
        type: String,
        trim: true
    }],
    folder: {
        type: String,
        default: 'General'
    },
    isTranslated: {
        type: Boolean,
        default: false
    },
    translatedContent: {
        language: String,
        content: String
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, folder: 1 });
noteSchema.index({ user: 1, tags: 1 });

export default mongoose.model('Note', noteSchema);