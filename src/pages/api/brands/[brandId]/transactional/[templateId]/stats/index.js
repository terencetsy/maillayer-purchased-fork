// src/pages/api/brands/[brandId]/transactional/[templateId]/stats.js
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@/lib/mongodb';
import TransactionalTemplate from '@/models/TransactionalTemplate';
import TransactionalLog from '@/models/TransactionalLog';
import { getTemplateById } from '@/services/transactionalService';

/**
 * @desc Get statistics for a transactional email template
 * @route GET /api/brands/:brandId/transactional/:templateId/stats
 * @access Private
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const userId = session.user.id;
        const { brandId, templateId } = req.query;

        if (!brandId || !templateId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Get the template
        const template = await getTemplateById(templateId, userId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Ensure the template belongs to the brand
        if (template.brandId.toString() !== brandId) {
            return res.status(403).json({ message: 'Template does not belong to this brand' });
        }

        // Get total sent count
        const sentCount = await TransactionalLog.countDocuments({
            templateId,
            brandId,
            userId,
        });

        // Get total delivered count
        const deliveredCount = await TransactionalLog.countDocuments({
            templateId,
            brandId,
            userId,
            status: 'delivered',
        });

        // Get open count from events
        const openCount = await TransactionalLog.aggregate([
            {
                $match: {
                    templateId: template._id,
                    brandId: template.brandId,
                    userId,
                },
            },
            {
                $project: {
                    events: {
                        $filter: {
                            input: '$events',
                            as: 'event',
                            cond: { $eq: ['$$event.type', 'open'] },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: { $size: '$events' } },
                },
            },
        ]);

        // Get click count from events
        const clickCount = await TransactionalLog.aggregate([
            {
                $match: {
                    templateId: template._id,
                    brandId: template.brandId,
                    userId,
                },
            },
            {
                $project: {
                    events: {
                        $filter: {
                            input: '$events',
                            as: 'event',
                            cond: { $eq: ['$$event.type', 'click'] },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: { $size: '$events' } },
                },
            },
        ]);

        // Get bounce count
        const bounceCount = await TransactionalLog.countDocuments({
            templateId,
            brandId,
            userId,
            status: 'failed',
            error: { $regex: 'Bounce', $options: 'i' },
        });

        // Get complaint count from events
        const complaintCount = await TransactionalLog.aggregate([
            {
                $match: {
                    templateId: template._id,
                    brandId: template.brandId,
                    userId,
                },
            },
            {
                $project: {
                    events: {
                        $filter: {
                            input: '$events',
                            as: 'event',
                            cond: { $eq: ['$$event.type', 'complaint'] },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: { $size: '$events' } },
                },
            },
        ]);

        // Calculate rates
        const opens = openCount.length > 0 ? openCount[0].count : 0;
        const clicks = clickCount.length > 0 ? clickCount[0].count : 0;
        const bounces = bounceCount || 0;
        const complaints = complaintCount.length > 0 ? complaintCount[0].count : 0;

        const openRate = sentCount > 0 ? ((opens / sentCount) * 100).toFixed(1) : 0;
        const clickRate = sentCount > 0 ? ((clicks / sentCount) * 100).toFixed(1) : 0;
        const bounceRate = sentCount > 0 ? ((bounces / sentCount) * 100).toFixed(1) : 0;
        const complaintRate = sentCount > 0 ? ((complaints / sentCount) * 100).toFixed(1) : 0;

        // Combine stats
        const stats = {
            sent: sentCount,
            delivered: deliveredCount,
            opens,
            clicks,
            bounces,
            complaints,
            openRate,
            clickRate,
            bounceRate,
            complaintRate,
        };

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching template stats:', error);
        return res.status(500).json({ message: 'Error fetching stats' });
    }
}
