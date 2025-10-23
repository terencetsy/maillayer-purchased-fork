// src/pages/api/brands/[brandId]/campaigns/[id]/quick-stats.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getCampaignById } from '@/services/campaignService';
import { getBrandById } from '@/services/brandService';
import { getCampaignStats } from '@/services/trackingService';

export default async function handler(req, res) {
    try {
        // Only allow GET requests
        if (req.method !== 'GET') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        await connectToDatabase();

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

        // Check if campaign exists and belongs to the user
        const campaign = await getCampaignById(id, userId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        if (campaign.brandId.toString() !== brandId) {
            return res.status(403).json({ message: 'Campaign does not belong to this brand' });
        }

        // Only fetch stats for non-draft campaigns
        if (campaign.status === 'draft' || campaign.status === 'scheduled') {
            return res.status(200).json({
                campaignId: id,
                stats: null,
                message: 'Campaign has not been sent yet',
            });
        }

        try {
            // Fetch real-time stats
            const stats = await getCampaignStats(id);

            const openRate = stats.recipients > 0 ? (((stats.open?.unique || 0) / stats.recipients) * 100).toFixed(1) : 0;

            return res.status(200).json({
                campaignId: id,
                statistics: {
                    ...stats,
                    openRate,
                    unsubscribedCount: stats.unsubscribed?.total || 0,
                    bouncedCount: stats.bounce?.total || 0,
                },
            });
        } catch (error) {
            console.error(`Error fetching stats for campaign ${id}:`, error);
            return res.status(500).json({
                message: 'Error fetching campaign stats',
                campaignId: id,
                statistics: null,
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
