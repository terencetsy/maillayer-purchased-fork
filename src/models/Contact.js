import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        listId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ContactList',
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
        customFields: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // New status field to replace isUnsubscribed
        status: {
            type: String,
            enum: ['active', 'unsubscribed', 'bounced', 'complained'],
            default: 'active',
        },
        // Keep these fields for historical reference
        isUnsubscribed: {
            type: Boolean,
            default: false,
        },
        unsubscribedAt: {
            type: Date,
            default: null,
        },
        unsubscribedFromCampaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Campaign',
            default: null,
        },
        unsubscribeReason: {
            type: String,
            default: null,
        },
        // Add these fields for bounce tracking
        bouncedAt: {
            type: Date,
            default: null,
        },
        bounceType: {
            type: String,
            default: null,
        },
        bounceReason: {
            type: String,
            default: null,
        },
        // For complaints
        complainedAt: {
            type: Date,
            default: null,
        },
        complaintReason: {
            type: String,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Create a compound unique index on email and listId to prevent duplicates
ContactSchema.index({ email: 1, listId: 1 }, { unique: true });

// Update the 'updatedAt' field on save
ContactSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// For backward compatibility - ensure isUnsubscribed stays in sync with status
ContactSchema.pre('save', function (next) {
    if (this.status === 'unsubscribed' && !this.isUnsubscribed) {
        this.isUnsubscribed = true;
        this.unsubscribedAt = this.unsubscribedAt || new Date();
    } else if (this.status !== 'unsubscribed' && this.isUnsubscribed) {
        this.status = 'unsubscribed';
    }
    next();
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

export default Contact;
