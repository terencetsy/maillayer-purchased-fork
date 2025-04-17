import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getIntegrationByType, createIntegration, updateIntegration } from '@/services/integrationService';

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

        // GET - Get Airtable integration if it exists
        if (req.method === 'GET') {
            const integration = await getIntegrationByType('airtable', brandId, userId);
            return res.status(200).json(integration || null);
        }

        // POST - Create/Update Airtable integration
        if (req.method === 'POST') {
            const { name, apiKey } = req.body;

            if (!apiKey) {
                return res.status(400).json({ message: 'Airtable API key is required' });
            }

            // Check if Airtable integration already exists
            const existingIntegration = await getIntegrationByType('airtable', brandId, userId);

            if (existingIntegration) {
                // Update existing integration
                const updatedIntegration = await updateIntegration(existingIntegration._id, brandId, userId, {
                    name: name || 'Airtable Integration',
                    config: {
                        apiKey: apiKey,
                    },
                    status: 'active',
                });
                return res.status(200).json(updatedIntegration);
            } else {
                // Create new integration
                const integration = await createIntegration({
                    name: name || 'Airtable Integration',
                    type: 'airtable',
                    config: {
                        apiKey: apiKey,
                    },
                    status: 'active',
                    brandId,
                    userId,
                });
                return res.status(201).json(integration);
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error handling Airtable integration:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
