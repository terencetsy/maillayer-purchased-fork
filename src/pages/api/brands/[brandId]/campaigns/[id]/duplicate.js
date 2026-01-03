// src/pages/api/brands/[brandId]/campaigns/[id]/duplicate.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getCampaignById, createCampaign } from '@/services/campaignService';
import { getBrandById } from '@/services/brandService';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
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
        const newName = req.body.name;

        if (!brandId || !id) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Check if the brand exists
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check permission (EDIT_CAMPAIGNS required for duplicating campaigns)
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.EDIT_CAMPAIGNS);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // Get the original campaign
        const campaign = await getCampaignById(id, brandId);

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        if (campaign.brandId.toString() !== brandId) {
            return res.status(403).json({ message: 'Campaign does not belong to this brand' });
        }

        // Create a new campaign based on the original one
        const duplicatedCampaignData = {
            name: newName || `${campaign.name} (Copy)`,
            subject: campaign.subject,
            content: campaign.content,
            brandId,
            userId,
            fromName: campaign.fromName || brand.fromName || '',
            fromEmail: campaign.fromEmail || brand.fromEmail,
            replyTo: campaign.replyTo || brand.replyToEmail,
            status: 'draft', // Always set as draft
        };

        // Create the new campaign
        const newCampaign = await createCampaign(duplicatedCampaignData);

        return res.status(201).json(newCampaign);
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
