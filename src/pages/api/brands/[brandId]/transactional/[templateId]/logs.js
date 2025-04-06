// src/pages/api/brands/[brandId]/transactional/[templateId]/logs.js
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@/lib/mongodb';
import TransactionalTemplate from '@/models/TransactionalTemplate';
import TransactionalLog from '@/models/TransactionalLog';
import { getTemplateById } from '@/services/transactionalService';
import mongoose from 'mongoose';

/**
 * @desc Get transaction logs for a transactional email template with filtering and pagination
 * @route GET /api/brands/:brandId/transactional/:templateId/logs
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

        // Parse pagination and filter parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const email = req.query.email || '';
        const status = req.query.status || '';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

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

        // Build filters for the query
        const query = {
            templateId: new mongoose.Types.ObjectId(templateId),
            brandId: new mongoose.Types.ObjectId(brandId),
            userId: new mongoose.Types.ObjectId(userId),
        };

        // Add email filter if provided
        if (email) {
            query.to = { $regex: email, $options: 'i' };
        }

        // Add status filter if provided
        if (status) {
            query.status = status;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            query.sentAt = {};
            if (startDate) {
                query.sentAt.$gte = startDate;
            }
            if (endDate) {
                query.sentAt.$lte = endDate;
            }
        }

        // Get total count for pagination
        const total = await TransactionalLog.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Get the logs with pagination
        const logs = await TransactionalLog.find(query)
            .sort({ sentAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Get status counts for filtering UI
        const statusCounts = await TransactionalLog.aggregate([
            {
                $match: {
                    templateId: new mongoose.Types.ObjectId(templateId),
                    brandId: new mongoose.Types.ObjectId(brandId),
                    userId: new mongoose.Types.ObjectId(userId),
                },
            },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { _id: 0, status: '$_id', count: 1 } },
        ]);

        // Format status counts as an object
        const statusCountsObj = {};
        statusCounts.forEach((item) => {
            statusCountsObj[item.status] = item.count;
        });

        return res.status(200).json({
            logs,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
            },
            statusCounts: statusCountsObj,
        });
    } catch (error) {
        console.error('Error fetching template logs:', error);
        return res.status(500).json({
            message: 'Error fetching logs',
            error: error.message,
        });
    }
}
