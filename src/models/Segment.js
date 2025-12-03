// src/models/Segment.js
import mongoose from 'mongoose';

const SegmentRuleSchema = new mongoose.Schema({
    field: {
        type: String,
        required: true,
    },
    operator: {
        type: String,
        required: true,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'in', 'not_in', 'has_tag', 'missing_tag', 'has_any_tag', 'has_all_tags', 'is_empty', 'is_not_empty', 'before', 'after'],
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
    },
});

const SegmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Segment name is required'],
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
        type: {
            type: String,
            enum: ['dynamic', 'static'],
            default: 'dynamic',
        },
        conditions: {
            matchType: {
                type: String,
                enum: ['all', 'any'],
                default: 'all',
            },
            rules: [SegmentRuleSchema],
        },
        contactListIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ContactList',
            },
        ],
        cachedCount: {
            type: Number,
            default: 0,
        },
        lastCountUpdated: {
            type: Date,
        },
        staticContactIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Contact',
            },
        ],
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

SegmentSchema.index({ brandId: 1, status: 1 });
SegmentSchema.index({ brandId: 1, type: 1 });

const Segment = mongoose.models.Segment || mongoose.model('Segment', SegmentSchema);

export default Segment;
