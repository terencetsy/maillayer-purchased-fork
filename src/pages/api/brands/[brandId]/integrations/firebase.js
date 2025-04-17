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

        // GET - Get Firebase integration if it exists
        if (req.method === 'GET') {
            const integration = await getIntegrationByType('firebase', brandId, userId);
            return res.status(200).json(integration || null);
        }

        // POST - Create/Update Firebase integration
        if (req.method === 'POST') {
            const { name, serviceAccountJson } = req.body;

            if (!serviceAccountJson) {
                return res.status(400).json({ message: 'Service account JSON is required' });
            }

            // Validate the service account JSON
            try {
                const parsedConfig = JSON.parse(serviceAccountJson);

                // Check required fields in service account JSON
                const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
                for (const field of requiredFields) {
                    if (!parsedConfig[field]) {
                        return res.status(400).json({ message: `Invalid service account JSON: missing ${field}` });
                    }
                }

                // Check if Firebase integration already exists
                const existingIntegration = await getIntegrationByType('firebase', brandId, userId);

                if (existingIntegration) {
                    // Update existing integration
                    const updatedIntegration = await updateIntegration(existingIntegration._id, brandId, userId, {
                        name: name || 'Firebase Integration',
                        config: {
                            serviceAccount: parsedConfig,
                            projectId: parsedConfig.project_id,
                        },
                        status: 'active',
                    });
                    return res.status(200).json(updatedIntegration);
                } else {
                    // Create new integration
                    const integration = await createIntegration({
                        name: name || 'Firebase Integration',
                        type: 'firebase',
                        config: {
                            serviceAccount: parsedConfig,
                            projectId: parsedConfig.project_id,
                        },
                        status: 'active',
                        brandId,
                        userId,
                    });
                    return res.status(201).json(integration);
                }
            } catch (error) {
                console.error('Error processing Firebase service account:', error);
                return res.status(400).json({ message: 'Invalid service account JSON format' });
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error handling Firebase integration:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
