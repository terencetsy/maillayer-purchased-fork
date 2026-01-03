import mongoose from 'mongoose';

const TeamMemberSchema = new mongoose.Schema(
    {
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
            required: [true, 'Brand ID is required'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            // Not required initially - set when invitation is accepted
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
        },
        role: {
            type: String,
            enum: {
                values: ['editor', 'viewer'],
                message: '{VALUE} is not a valid role',
            },
            required: [true, 'Role is required'],
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'active', 'revoked'],
                message: '{VALUE} is not a valid status',
            },
            default: 'pending',
        },
        inviteToken: {
            type: String,
            select: false,
        },
        inviteTokenExpires: {
            type: Date,
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        invitedAt: {
            type: Date,
            default: Date.now,
        },
        acceptedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique brand-email combinations
TeamMemberSchema.index({ brandId: 1, email: 1 }, { unique: true });

// Index for token lookups
TeamMemberSchema.index({ inviteToken: 1 });

// Index for user lookups
TeamMemberSchema.index({ userId: 1, status: 1 });

const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', TeamMemberSchema);

export default TeamMember;
