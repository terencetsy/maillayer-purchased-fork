// src/pages/api/brands/[brandId]/contacts/tags.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);
        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId } = req.query;

        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // GET: Get all unique tags for this brand
        if (req.method === 'GET') {
            const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.VIEW_CONTACTS);
            if (!authCheck.authorized) {
                return res.status(authCheck.status).json({ message: authCheck.message });
            }
            const tags = await Contact.distinct('tags', {
                brandId: new mongoose.Types.ObjectId(brandId),
            });

            // Get count for each tag
            const tagCounts = await Contact.aggregate([{ $match: { brandId: new mongoose.Types.ObjectId(brandId) } }, { $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);

            return res.status(200).json({
                tags: tagCounts.map((t) => ({ name: t._id, count: t.count })),
            });
        }

        // POST: Add tags to contacts
        if (req.method === 'POST') {
            const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.EDIT_CONTACTS);
            if (!authCheck.authorized) {
                return res.status(authCheck.status).json({ message: authCheck.message });
            }

            const { contactIds, tags, action = 'add' } = req.body;

            if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
                return res.status(400).json({ message: 'Contact IDs required' });
            }

            if (!tags || !Array.isArray(tags) || tags.length === 0) {
                return res.status(400).json({ message: 'Tags required' });
            }

            const normalizedTags = tags.map((t) => t.toLowerCase().trim());
            const objectIds = contactIds.map((id) => new mongoose.Types.ObjectId(id));

            let result;
            if (action === 'add') {
                result = await Contact.updateMany(
                    {
                        _id: { $in: objectIds },
                        brandId: new mongoose.Types.ObjectId(brandId),
                    },
                    { $addToSet: { tags: { $each: normalizedTags } } }
                );
            } else if (action === 'remove') {
                result = await Contact.updateMany(
                    {
                        _id: { $in: objectIds },
                        brandId: new mongoose.Types.ObjectId(brandId),
                    },
                    { $pullAll: { tags: normalizedTags } }
                );
            } else if (action === 'set') {
                result = await Contact.updateMany(
                    {
                        _id: { $in: objectIds },
                        brandId: new mongoose.Types.ObjectId(brandId),
                    },
                    { $set: { tags: normalizedTags } }
                );
            }

            return res.status(200).json({
                success: true,
                modified: result.modifiedCount,
            });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error managing tags:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
