// src/pages/api/brands/[brandId]/contacts/custom-fields.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

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

        // Check permission
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.VIEW_CONTACTS);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // Aggregate to find all unique custom field keys and their types/values
        const customFieldsAggregation = await Contact.aggregate([
            {
                $match: {
                    brandId: new mongoose.Types.ObjectId(brandId),
                    customFields: { $exists: true, $ne: null, $ne: {} },
                },
            },
            {
                $project: {
                    customFieldsArray: { $objectToArray: '$customFields' },
                },
            },
            {
                $unwind: '$customFieldsArray',
            },
            {
                $group: {
                    _id: '$customFieldsArray.k',
                    sampleValues: { $addToSet: '$customFieldsArray.v' },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 50, // Limit to 50 custom fields
            },
        ]);

        // Process the results to determine types and unique values
        const fields = customFieldsAggregation.map((field) => {
            const name = field._id;
            const sampleValues = field.sampleValues.slice(0, 100); // Limit sample values
            const count = field.count;

            // Determine field type based on sample values
            let type = 'text';
            let values = [];

            if (sampleValues.length > 0) {
                const firstValue = sampleValues[0];

                // Check if boolean
                if (sampleValues.every((v) => v === true || v === false || v === 'true' || v === 'false')) {
                    type = 'boolean';
                }
                // Check if number
                else if (sampleValues.every((v) => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(v)))) {
                    type = 'number';
                }
                // Check if date
                else if (sampleValues.every((v) => !isNaN(Date.parse(v)) && typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}/))) {
                    type = 'date';
                }
                // If there are limited unique values, treat as select
                else if (sampleValues.length <= 20 && sampleValues.every((v) => typeof v === 'string')) {
                    type = 'select';
                    values = [...new Set(sampleValues.filter((v) => v !== null && v !== ''))].sort();
                }
            }

            return {
                name,
                type,
                values,
                count,
            };
        });

        return res.status(200).json({ fields });
    } catch (error) {
        console.error('Error fetching custom fields:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
