// src/pages/api/brands/[brandId]/transactional/[templateId]/stats/index.js
import { getSession } from 'next-auth/react';
import connectToDatabase from '@/lib/mongodb';
import TransactionalLog from '@/models/TransactionalLog';
import { getTemplateById } from '@/services/transactionalService';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

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

        // Convert to ObjectIds for aggregation queries
        const templateObjectId = new mongoose.Types.ObjectId(templateId);
        const brandObjectId = new mongoose.Types.ObjectId(brandId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get total sent count
        const sentCount = await TransactionalLog.countDocuments({
            templateId: templateObjectId,
            brandId: brandObjectId,
            userId: userObjectId,
        });

        // Get total delivered count
        const deliveredCount = await TransactionalLog.countDocuments({
            templateId: templateObjectId,
            brandId: brandObjectId,
            userId: userObjectId,
            status: 'delivered',
        });

        // Get unique opens (count logs that have at least one open event)
        const openCount = await TransactionalLog.countDocuments({
            templateId: templateObjectId,
            brandId: brandObjectId,
            userId: userObjectId,
            'events.type': 'open',
        });

        // Get unique clicks (count logs that have at least one click event)
        const clickCount = await TransactionalLog.countDocuments({
            templateId: templateObjectId,
            brandId: brandObjectId,
            userId: userObjectId,
            'events.type': 'click',
        });

        // Get bounce count
        const bounceCount = await TransactionalLog.countDocuments({
            templateId: templateObjectId,
            brandId: brandObjectId,
            userId: userObjectId,
            $or: [{ status: 'failed', error: { $regex: 'bounce', $options: 'i' } }, { 'events.type': 'bounce' }],
        });

        // Get complaint count
        const complaintCount = await TransactionalLog.countDocuments({
            templateId: templateObjectId,
            brandId: brandObjectId,
            userId: userObjectId,
            'events.type': 'complaint',
        });

        // Calculate rates
        const openRate = sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0';
        const clickRate = sentCount > 0 ? ((clickCount / sentCount) * 100).toFixed(1) : '0';
        const bounceRate = sentCount > 0 ? ((bounceCount / sentCount) * 100).toFixed(1) : '0';
        const complaintRate = sentCount > 0 ? ((complaintCount / sentCount) * 100).toFixed(1) : '0';

        const stats = {
            sent: sentCount,
            delivered: deliveredCount,
            opens: openCount,
            clicks: clickCount,
            bounces: bounceCount,
            complaints: complaintCount,
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
