// src/pages/api/brands/[brandId]/campaigns/index.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getCampaignsByBrandId, getCampaignsCount, createCampaign } from '@/services/campaignService';
import { getBrandById } from '@/services/brandService';
import { getCampaignStats } from '@/services/trackingService';

export default async function handler(req, res) {
    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId } = req.query;

        if (!brandId) {
            return res.status(400).json({ message: 'Missing brand ID' });
        }

        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // GET request - get campaigns for a brand with pagination
        if (req.method === 'GET') {
            try {
                // Parse pagination params
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 8;
                const skip = (page - 1) * limit;

                // Validate limit (only allow 8, 15, or 30)
                const validLimits = [8, 15, 30];
                const actualLimit = validLimits.includes(limit) ? limit : 8;

                // Fetch campaigns with pagination
                const [campaigns, totalCount] = await Promise.all([getCampaignsByBrandId(brandId, userId, { skip, limit: actualLimit }), getCampaignsCount(brandId, userId)]);

                // Only fetch stats for non-draft campaigns
                // Process in batches to avoid overwhelming the system
                const CONCURRENT_STATS_LIMIT = 5;
                const campaignsWithStats = [];

                for (let i = 0; i < campaigns.length; i += CONCURRENT_STATS_LIMIT) {
                    const batch = campaigns.slice(i, i + CONCURRENT_STATS_LIMIT);

                    const batchResults = await Promise.all(
                        batch.map(async (campaign) => {
                            if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
                                try {
                                    const stats = await getCampaignStats(campaign._id);

                                    const openRate = stats.recipients > 0 ? (((stats.open?.unique || 0) / stats.recipients) * 100).toFixed(1) : 0;

                                    const campaignObj = campaign && typeof campaign.toObject === 'function' ? campaign.toObject() : JSON.parse(JSON.stringify(campaign));

                                    return {
                                        ...campaignObj,
                                        statistics: {
                                            ...stats,
                                            openRate,
                                            unsubscribedCount: stats.unsubscribed?.total || 0,
                                            bouncedCount: stats.bounce?.total || 0,
                                        },
                                    };
                                } catch (error) {
                                    console.warn(`Error fetching stats for campaign ${campaign._id}:`, error);
                                    return campaign;
                                }
                            }
                            return campaign;
                        })
                    );

                    campaignsWithStats.push(...batchResults);
                }

                // Return paginated response
                return res.status(200).json({
                    campaigns: campaignsWithStats,
                    pagination: {
                        page,
                        limit: actualLimit,
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / actualLimit),
                        hasMore: page * actualLimit < totalCount,
                    },
                });
            } catch (error) {
                console.error('Error fetching campaigns:', error);
                return res.status(500).json({ message: 'Error fetching campaigns' });
            }
        }

        // POST request - create new campaign
        if (req.method === 'POST') {
            try {
                const { name, subject, content, fromName, fromEmail, replyTo, status, scheduleType, scheduledAt } = req.body;

                if (!name || !subject) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                const campaignData = {
                    name,
                    subject,
                    content: content || '',
                    brandId,
                    userId,
                    fromName: brand.fromName || '',
                    fromEmail: brand.fromEmail,
                    replyTo: replyTo || brand.replyToEmail,
                    status: status || 'draft',
                    scheduleType: scheduleType || 'send_now',
                    scheduledAt: scheduledAt || null,
                };

                const newCampaign = await createCampaign(campaignData);
                return res.status(201).json(newCampaign);
            } catch (error) {
                console.error('Error creating campaign:', error);
                return res.status(500).json({ message: 'Error creating campaign' });
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
