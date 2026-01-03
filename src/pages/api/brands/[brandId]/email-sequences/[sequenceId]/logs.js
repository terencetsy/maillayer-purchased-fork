// src/pages/api/brands/[brandId]/email-sequences/[sequenceId]/logs.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getEmailSequenceById } from '@/services/emailSequenceService';
import { getSequenceLogs } from '@/services/sequenceLogService';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);
        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId, sequenceId } = req.query;

        if (!brandId || !sequenceId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Check if brand exists
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check permission - viewing logs is a view operation for sequences
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.VIEW_SEQUENCES);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // Parse pagination and filter parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const email = req.query.email || '';
        const status = req.query.status || '';
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;

        // Get the sequence - filter by brandId only
        const sequence = await getEmailSequenceById(sequenceId, brandId);

        if (!sequence) {
            return res.status(404).json({ message: 'Sequence not found' });
        }

        // Get logs
        const result = await getSequenceLogs(sequenceId, {
            page,
            limit,
            email,
            status,
            startDate,
            endDate,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching sequence logs:', error);
        return res.status(500).json({
            message: 'Error fetching logs',
            error: error.message,
        });
    }
}
