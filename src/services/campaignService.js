// src/services/campaignService.js

import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import mongoose from 'mongoose';

export async function createCampaign(campaignData) {
    await connectToDatabase();

    const campaign = new Campaign({
        ...campaignData,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await campaign.save();
    return campaign;
}

export async function getCampaignsByBrandId(brandId, userId, options = {}) {
    await connectToDatabase();

    const { skip = 0, limit = 10 } = options;

    // Filter by brandId only - authorization is handled at the API layer
    const campaigns = await Campaign.find({
        brandId,
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return campaigns;
}

export async function getCampaignsCount(brandId, userId) {
    await connectToDatabase();

    // Filter by brandId only - authorization is handled at the API layer
    return await Campaign.countDocuments({
        brandId,
    });
}

export async function getCampaignById(campaignId, brandId = null) {
    await connectToDatabase();

    // Filter by campaignId only - authorization is handled at the API layer
    const query = { _id: campaignId };
    if (brandId) {
        query.brandId = brandId;
    }

    const campaign = await Campaign.findOne(query).lean();

    return campaign;
}

export async function updateCampaign(campaignId, brandId, updateData) {
    await connectToDatabase();

    // Filter by campaignId and brandId - authorization is handled at the API layer
    const result = await Campaign.updateOne(
        { _id: campaignId, brandId },
        {
            $set: {
                ...updateData,
                updatedAt: new Date(),
            },
        }
    );

    return result.modifiedCount > 0;
}

export async function deleteCampaign(campaignId, brandId) {
    await connectToDatabase();

    // Filter by campaignId and brandId - authorization is handled at the API layer
    const result = await Campaign.deleteOne({ _id: campaignId, brandId });
    return result.deletedCount > 0;
}

// Get campaign stats summary for a brand
export async function getCampaignStatsByBrandId(brandId) {
    await connectToDatabase();

    // Filter by brandId only - authorization is handled at the API layer
    const stats = await Campaign.aggregate([
        { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
        {
            $group: {
                _id: null,
                totalCampaigns: { $sum: 1 },
                totalSent: { $sum: '$stats.recipients' },
                totalOpens: { $sum: '$stats.opens' },
                totalClicks: { $sum: '$stats.clicks' },
                completedCampaigns: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'sent'] }, 1, 0],
                    },
                },
            },
        },
    ]);

    if (stats.length === 0) {
        return {
            totalCampaigns: 0,
            totalSent: 0,
            totalOpens: 0,
            totalClicks: 0,
            completedCampaigns: 0,
            openRate: 0,
            clickRate: 0,
        };
    }

    const result = stats[0];
    result.openRate = result.totalSent > 0 ? ((result.totalOpens / result.totalSent) * 100).toFixed(1) : 0;
    result.clickRate = result.totalSent > 0 ? ((result.totalClicks / result.totalSent) * 100).toFixed(1) : 0;

    return result;
}
