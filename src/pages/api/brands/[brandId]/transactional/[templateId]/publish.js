// src/pages/api/brands/[brandId]/transactional/[templateId]/publish.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getTransactionalTemplate, updateTransactionalTemplate } from '@/services/transactionalService';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    try {
        // Only allow PUT requests
        if (req.method !== 'PUT') {
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

        // Check if brand is ready to send emails
        if (brand.status !== 'active') {
            return res.status(400).json({ message: 'Brand is not verified for sending emails' });
        }

        // Get the template
        const template = await getTransactionalTemplate(templateId, brandId, userId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (template.status === 'published') {
            return res.status(400).json({ message: 'Template is already published' });
        }

        // Generate API key if not already present
        const apiKey = template.apiKey || `trx_${uuidv4().replace(/-/g, '')}`;

        // Update the template status and API key
        const updateData = {
            status: 'published',
            apiKey,
            publishedAt: new Date(),
        };

        const updatedTemplate = await updateTransactionalTemplate(templateId, brandId, userId, updateData);

        if (!updatedTemplate) {
            return res.status(500).json({ message: 'Failed to publish template' });
        }

        res.status(200).json({
            message: 'Template published successfully',
            template: updatedTemplate,
        });
    } catch (error) {
        console.error('Error publishing template:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
