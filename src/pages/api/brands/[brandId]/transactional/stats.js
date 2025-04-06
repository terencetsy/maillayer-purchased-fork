import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getTemplateById, getTemplateStats, getTemplateLogs } from '@/services/transactionalService';

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
        const { brandId, id } = req.query;

        if (!brandId || !id) {
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

        // Check if the template exists and belongs to the user
        const template = await getTemplateById(id, userId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (template.brandId.toString() !== brandId) {
            return res.status(403).json({ message: 'Template does not belong to this brand' });
        }

        // Determine if we need to fetch logs or just summary stats
        const { logs, page, limit, email, status } = req.query;

        if (logs === 'true') {
            // Fetch detailed logs with pagination
            const logsData = await getTemplateLogs(id, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 50,
                email,
                status,
            });

            return res.status(200).json(logsData);
        } else {
            // Fetch summary stats
            const stats = await getTemplateStats(id);
            return res.status(200).json(stats);
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
