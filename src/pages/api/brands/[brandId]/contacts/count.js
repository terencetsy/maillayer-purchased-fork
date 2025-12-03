// src/pages/api/brands/[brandId]/contacts/count.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import Segment from '@/models/Segment';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';

// Build segment query
function buildSegmentQuery(segment, brandId) {
    const baseQuery = {
        brandId: new mongoose.Types.ObjectId(brandId),
        status: 'active',
    };

    if (segment.contactListIds && segment.contactListIds.length > 0) {
        baseQuery.listId = {
            $in: segment.contactListIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
    }

    if (segment.type === 'static') {
        return {
            ...baseQuery,
            _id: { $in: segment.staticContactIds || [] },
        };
    }

    if (!segment.conditions || !segment.conditions.rules || segment.conditions.rules.length === 0) {
        return baseQuery;
    }

    const conditions = segment.conditions.rules.map((rule) => buildRuleQuery(rule)).filter((c) => Object.keys(c).length > 0);

    if (conditions.length === 0) {
        return baseQuery;
    }

    const matchOperator = segment.conditions.matchType === 'any' ? '$or' : '$and';

    return {
        ...baseQuery,
        [matchOperator]: conditions,
    };
}

function buildRuleQuery(rule) {
    const { field, operator, value } = rule;

    switch (operator) {
        case 'equals':
            return { [field]: value };
        case 'not_equals':
            return { [field]: { $ne: value } };
        case 'contains':
            return { [field]: { $regex: value, $options: 'i' } };
        case 'has_tag':
            return { tags: value };
        case 'missing_tag':
            return { tags: { $ne: value } };
        case 'has_any_tag':
            return { tags: { $in: Array.isArray(value) ? value : [value] } };
        case 'has_all_tags':
            return { tags: { $all: Array.isArray(value) ? value : [value] } };
        default:
            return {};
    }
}

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);
        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId } = req.query;

        const brand = await getBrandById(brandId);
        if (!brand || brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Parse list IDs and segment IDs from query
        const listIds = req.query.listIds ? req.query.listIds.split(',').filter(Boolean) : [];
        const segmentIds = req.query.segmentIds ? req.query.segmentIds.split(',').filter(Boolean) : [];

        if (listIds.length === 0 && segmentIds.length === 0) {
            return res.status(200).json({ count: 0 });
        }

        // Build the combined query
        const orConditions = [];

        // Add contact list conditions
        if (listIds.length > 0) {
            orConditions.push({
                listId: { $in: listIds.map((id) => new mongoose.Types.ObjectId(id)) },
            });
        }

        // Add segment conditions
        if (segmentIds.length > 0) {
            const segments = await Segment.find({
                _id: { $in: segmentIds.map((id) => new mongoose.Types.ObjectId(id)) },
                brandId: new mongoose.Types.ObjectId(brandId),
            });

            for (const segment of segments) {
                const segmentQuery = buildSegmentQuery(segment, brandId);
                // Extract segment-specific conditions
                const { brandId: _, status: __, ...segmentConditions } = segmentQuery;
                if (Object.keys(segmentConditions).length > 0) {
                    orConditions.push(segmentConditions);
                }
            }
        }

        // Base query
        const baseQuery = {
            brandId: new mongoose.Types.ObjectId(brandId),
            status: 'active',
        };

        let finalQuery;
        if (orConditions.length === 1) {
            finalQuery = { ...baseQuery, ...orConditions[0] };
        } else if (orConditions.length > 1) {
            finalQuery = { ...baseQuery, $or: orConditions };
        } else {
            finalQuery = baseQuery;
        }

        // Use aggregation to count unique emails (avoid duplicates)
        const result = await Contact.aggregate([{ $match: finalQuery }, { $group: { _id: '$email' } }, { $count: 'total' }]);

        const count = result.length > 0 ? result[0].total : 0;

        return res.status(200).json({ count });
    } catch (error) {
        console.error('Error counting contacts:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
