import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getActiveContactsCount } from '@/services/contactService';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    try {
        // This endpoint only supports GET requests
        if (req.method !== 'GET') {
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
        const { brandId } = req.query;
        const listIds = req.query.listIds ? req.query.listIds.split(',') : [];

        if (!brandId) {
            return res.status(400).json({ message: 'Missing brand ID' });
        }

        // Check if the brand exists
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check permission
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.VIEW_CONTACTS);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // If no list IDs provided, return empty result
        if (listIds.length === 0) {
            return res.status(200).json({});
        }

        // Query to get counts for all lists in one go
        const listObjectIds = listIds.map((id) => new mongoose.Types.ObjectId(id));

        // In the aggregation query for active contacts
        const countsResult = await Contact.aggregate([
            {
                $match: {
                    listId: { $in: listObjectIds },
                    brandId: new mongoose.Types.ObjectId(brandId),
                    userId: new mongoose.Types.ObjectId(userId),
                    status: 'active', // Only count active contacts
                },
            },
            {
                $group: {
                    _id: '$listId',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Convert to a more usable format
        const counts = {};
        countsResult.forEach((item) => {
            counts[item._id.toString()] = item.count;
        });

        // Make sure all requested lists have a count
        listIds.forEach((id) => {
            if (!counts[id]) counts[id] = 0;
        });

        return res.status(200).json(counts);
    } catch (error) {
        console.error('Error getting active contact counts:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
