import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { createBrand, getBrandsByUserId } from '@/services/brandService';

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

        // GET request - fetch brands
        if (req.method === 'GET') {
            try {
                const brands = await getBrandsByUserId(userId);
                return res.status(200).json(brands);
            } catch (error) {
                console.error('Error fetching brands:', error);
                return res.status(500).json({ message: 'Error fetching brands' });
            }
        }

        // POST request - create new brand
        if (req.method === 'POST') {
            try {
                const { name, website } = req.body;

                if (!name || !website) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                const brandData = {
                    name,
                    website,
                    userId,
                    status: 'pending_setup',
                };

                const newBrand = await createBrand(brandData);

                return res.status(201).json(newBrand);
            } catch (error) {
                console.error('Error creating brand:', error);
                return res.status(500).json({ message: 'Error creating brand' });
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
