// src/models/SequenceEnrollment.js
import mongoose from 'mongoose';

const SequenceEnrollmentSchema = new mongoose.Schema(
    {
        sequenceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EmailSequence',
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
        status: {
            type: String,
            enum: ['active', 'completed', 'paused', 'unsubscribed', 'bounced'],
            default: 'active',
        },
        currentStep: {
            type: Number,
            default: 0,
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
        emailsSent: [
            {
                emailId: String, // ID of the email from the sequence
                emailOrder: Number,
                sentAt: Date,
                messageId: String,
                status: {
                    type: String,
                    enum: ['sent', 'opened', 'clicked', 'bounced', 'complained'],
                    default: 'sent',
                },
                openedAt: Date,
                clickedAt: Date,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate enrollments
SequenceEnrollmentSchema.index({ sequenceId: 1, contactId: 1 }, { unique: true });
SequenceEnrollmentSchema.index({ brandId: 1, status: 1 });
SequenceEnrollmentSchema.index({ sequenceId: 1, status: 1 });

const SequenceEnrollment = mongoose.models.SequenceEnrollment || mongoose.model('SequenceEnrollment', SequenceEnrollmentSchema);

export default SequenceEnrollment;
