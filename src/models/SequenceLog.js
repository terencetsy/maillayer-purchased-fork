// src/models/SequenceLog.js
import mongoose from 'mongoose';

const SequenceLogSchema = new mongoose.Schema({
    sequenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailSequence',
        required: true,
    },
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SequenceEnrollment',
        required: true,
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true,
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    emailOrder: {
        type: Number,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'failed'],
        default: 'sent',
    },
    messageId: {
        type: String,
    },
    error: {
        type: String,
    },
    events: [
        {
            type: {
                type: String,
                enum: ['open', 'click', 'bounce', 'complaint'],
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            metadata: {
                type: mongoose.Schema.Types.Mixed,
                default: {},
            },
        },
    ],
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
SequenceLogSchema.index({ sequenceId: 1, createdAt: -1 });
SequenceLogSchema.index({ enrollmentId: 1 });
SequenceLogSchema.index({ email: 1 });
SequenceLogSchema.index({ brandId: 1, createdAt: -1 });

// Dynamic model creation function for sequence-specific logs collections
export const createSequenceLogModel = (sequenceId) => {
    const collectionName = `seq_logs_${sequenceId}`;

    // Check if model already exists to prevent model overwrite warnings
    return mongoose.models[collectionName] || mongoose.model(collectionName, SequenceLogSchema, collectionName);
};

const SequenceLog = mongoose.models.SequenceLog || mongoose.model('SequenceLog', SequenceLogSchema);

export default SequenceLog;
