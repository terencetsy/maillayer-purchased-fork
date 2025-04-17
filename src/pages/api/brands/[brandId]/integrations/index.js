import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getIntegrationsByBrandId, createIntegration } from '@/services/integrationService';

export default async function handler(req, res) {
    try {
        // Connect to database
        await connectToDatabase();

        // Get session directly from server
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId } = req.query;

        if (!brandId) {
            return res.status(400).json({ message: 'Missing brand ID' });
        }

        // Check if the brand belongs to the user
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // GET - Fetch all integrations for a brand
        if (req.method === 'GET') {
            const integrations = await getIntegrationsByBrandId(brandId, userId);
            return res.status(200).json(integrations);
        }

        // POST - Create a new integration
        if (req.method === 'POST') {
            const { name, type, config } = req.body;

            if (!name || !type) {
                return res.status(400).json({ message: 'Name and type are required' });
            }

            // Create the integration
            const integration = await createIntegration({
                name,
                type,
                config: config || {},
                status: 'inactive', // Default status
                brandId,
                userId,
            });

            return res.status(201).json(integration);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error handling integrations:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
