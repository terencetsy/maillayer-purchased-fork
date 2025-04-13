import connectToDatabase from '@/lib/mongodb';
import TransactionalTemplate from '@/models/TransactionalTemplate';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    // Only allow POST requests for regenerating API key
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed', success: false });
    }

    try {
        // Check user session
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: 'Unauthorized', success: false });
        }

        // Get brand ID and template ID from URL
        const { brandId, templateId } = req.query;

        // Connect to database
        await connectToDatabase();

        // Find the template
        const template = await TransactionalTemplate.findOne({
            _id: templateId,
            brandId: brandId,
            userId: session.user.id, // Ensure the template belongs to the user
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found', success: false });
        }

        // Generate a new API key using the same pattern as in template creation
        const apiKey = `txn_${new mongoose.Types.ObjectId().toString()}_${Date.now().toString(36)}`;

        // Update the template with the new API key
        template.apiKey = apiKey;
        await template.save();

        return res.status(200).json({
            message: 'API key regenerated successfully',
            apiKey,
            success: true,
        });
    } catch (error) {
        console.error('Error regenerating API key:', error);
        return res.status(500).json({
            message: error.message || 'Error regenerating API key',
            success: false,
        });
    }
}
