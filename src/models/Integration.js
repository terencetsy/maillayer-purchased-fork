import mongoose from 'mongoose';

const IntegrationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Integration name is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: {
                values: ['firebase', 'supabase', 'auth0', 'airtable', 'google_sheets'],
                message: '{VALUE} is not a supported integration type',
            },
            required: [true, 'Integration type is required'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
            required: [true, 'Brand ID is required'],
        },
        config: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive', 'error'],
                message: '{VALUE} is not a valid status',
            },
            default: 'inactive',
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

// Pre-save hook to update timestamps
IntegrationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Integration = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);

export default Integration;
