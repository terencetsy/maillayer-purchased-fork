import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getTemplateById, regenerateApiKey } from '@/services/transactionalService';
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

        if (!brandId || !id) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Check if the brand belongs to the user
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check permission - regenerating key is an edit operation
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.EDIT_TRANSACTIONAL);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // Check if the template exists
        const template = await getTemplateById(id, brandId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Regenerate API key
        const newApiKey = await regenerateApiKey(id, brandId);

        if (newApiKey) {
            return res.status(200).json({
                apiKey: newApiKey,
                message: 'API key regenerated successfully',
            });
        } else {
            return res.status(500).json({ message: 'Failed to regenerate API key' });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
