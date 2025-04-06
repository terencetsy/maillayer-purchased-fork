// src/pages/api/brands/[brandId]/transactional/[templateId]/stats.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getTransactionalTemplate } from '@/services/transactionalService';
import TransactionalLog from '@/models/TransactionalLog';

export default async function handler(req, res) {
    try {
        // Only allow GET requests
        if (req.method !== 'GET') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        // Connect to database
        await connectToDatabase();

        // Get session directly from server
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId, templateId } = req.query;

        if (!brandId || !templateId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Check if the brand belongs to the user
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // Get the template
        const template = await getTransactionalTemplate(templateId, brandId, userId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Gather statistics
        const sent = await TransactionalLog.countDocuments({
            templateId,
            brandId,
            status: 'sent',
        });

        const opened = await TransactionalLog.countDocuments({
            templateId,
            brandId,
            'events.type': 'open',
        });

        const clicked = await TransactionalLog.countDocuments({
            templateId,
            brandId,
            'events.type': 'click',
        });

        const failed = await TransactionalLog.countDocuments({
            templateId,
            brandId,
            status: 'failed',
        });

        // Get recent logs (most recent 5 records)
        const recentLogs = await TransactionalLog.find({ templateId, brandId }).sort({ createdAt: -1 }).limit(5).lean();

        // Format logs for response
        const formattedLogs = recentLogs.map((log) => ({
            id: log._id,
            recipient: log.recipient,
            status: log.status,
            sentAt: log.createdAt,
            events: log.events || [],
        }));

        res.status(200).json({
            sent,
            opened,
            clicked,
            failed,
            recentLogs: formattedLogs,
        });
    } catch (error) {
        console.error('Error fetching template stats:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
