// src/pages/api/brands/[brandId]/email-sequences/[sequenceId]/stats.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getEmailSequenceById } from '@/services/emailSequenceService';
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

        // Check permission - viewing stats is a view operation for sequences
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.VIEW_SEQUENCES);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // Get the sequence - filter by brandId only
        const sequence = await getEmailSequenceById(sequenceId, brandId);

        if (!sequence) {
            return res.status(404).json({ message: 'Sequence not found' });
        }

        // Return the stats from the sequence document
        return res.status(200).json({
            totalEnrolled: sequence.stats?.totalEnrolled || 0,
            totalActive: sequence.stats?.totalActive || 0,
            totalCompleted: sequence.stats?.totalCompleted || 0,
            totalFailed: sequence.stats?.totalFailed || 0,
            totalUnsubscribed: sequence.stats?.totalUnsubscribed || 0,
            emailsSent: sequence.stats?.emailsSent || 0,
            emailsOpened: sequence.stats?.emailsOpened || 0,
            emailsClicked: sequence.stats?.emailsClicked || 0,
        });
    } catch (error) {
        console.error('Error fetching sequence stats:', error);
        return res.status(500).json({
            message: 'Error fetching stats',
            error: error.message,
        });
    }
}
