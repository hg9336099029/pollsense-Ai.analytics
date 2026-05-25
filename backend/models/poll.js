const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    pollType: {
        type: String,
        required: true,
    },
    options: [
        {
            text: { type: String, required: true },
            votes: { type: Number, default: 0 },
        }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: { type: String, required: true },
        }
    ],
    images: [
        {
            type: String,
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    voters: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    sentiment: {
        label: {
            type: String,
            enum: ['Positive', 'Negative', 'Neutral', 'Controversial', 'Engaging'],
        },
        score: { type: Number, min: 0, max: 100 },
        emotion: { type: String },
        topic: { type: String },
        summary: { type: String },
        keywords: [{ type: String }],
        analyzedAt: { type: Date },
    },
}, { timestamps: true });

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
