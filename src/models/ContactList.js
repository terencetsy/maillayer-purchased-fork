import mongoose from 'mongoose';

const ContactListSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'List name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
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
        contactCount: {
            type: Number,
            default: 0,
        },
        lastCheckedAt: {
            type: Date,
            default: null,
            index: true,
        },
        webhookSecret: {
            type: String,
            trim: true,
        },
        webhookEndpoint: {
            type: String,
            trim: true,
        },
        apiKey: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null values
            trim: true,
        },
        apiEnabled: {
            type: Boolean,
            default: false,
        },
        allowedDomains: [
            {
                type: String,
                trim: true,
            },
        ],
        apiSettings: {
            requireDoubleOptIn: {
                type: Boolean,
                default: false,
            },
            allowDuplicates: {
                type: Boolean,
                default: false,
            },
            redirectUrl: {
                type: String,
                trim: true,
            },
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

// Update the 'updatedAt' field on save
ContactListSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const ContactList = mongoose.models.ContactList || mongoose.model('ContactList', ContactListSchema);

export default ContactList;
