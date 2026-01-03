// src/pages/api/brands/[brandId]/contact-lists/[listId]/daily-stats.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getContactListById } from '@/services/contactService';
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
        const { brandId, listId } = req.query;

        // Optional query parameters
        const daysParam = req.query.days || 30; // Default to last 30 days
        const days = parseInt(daysParam);

        const status = req.query.status || 'all'; // Filter by status if provided

        if (!brandId || !listId) {
            return res.status(400).json({ message: 'Missing required parameters' });
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

        // Check if the list exists
        const contactList = await getContactListById(listId, brandId, userId);
        if (!contactList) {
            return res.status(404).json({ message: 'Contact list not found' });
        }

        // Calculate the date for 'days' ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Build the match conditions
        const matchConditions = {
            listId: new mongoose.Types.ObjectId(listId),
            brandId: new mongoose.Types.ObjectId(brandId),
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate },
        };

        // Add status filter if provided
        if (status && status !== 'all') {
            matchConditions.status = status;
        }

        // Aggregate daily counts
        const dailyStats = await Contact.aggregate([
            {
                $match: matchConditions,
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    count: { $sum: 1 },
                    active: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
                        },
                    },
                    unsubscribed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'unsubscribed'] }, 1, 0],
                        },
                    },
                    bounced: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0],
                        },
                    },
                    complained: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'complained'] }, 1, 0],
                        },
                    },
                },
            },
            {
                $sort: { _id: 1 }, // Sort by date ascending
            },
        ]);

        // Create a complete date range with zero values for missing dates
        const dailyData = [];
        const endDate = new Date(); // Current timestamp

        // Get today's date string
        const todayStr = endDate.toISOString().split('T')[0];

        // Fill in the data array with all dates in range
        let currentDate = new Date(startDate);

        // We'll use a completely different approach to be sure:
        // First generate all the dates in our range
        const allDates = [];
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            allDates.push(dateStr);

            // Create a new date object (to avoid modifying the existing one)
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            currentDate = nextDate;
        }

        // Now process all dates, and ensure today is included
        if (!allDates.includes(todayStr)) {
            allDates.push(todayStr);
        }

        // Map dates to data
        for (const dateStr of allDates) {
            const existingData = dailyStats.find((item) => item._id === dateStr);

            if (existingData) {
                dailyData.push({
                    date: dateStr,
                    count: existingData.count,
                    active: existingData.active,
                    unsubscribed: existingData.unsubscribed,
                    bounced: existingData.bounced,
                    complained: existingData.complained,
                });
            } else {
                dailyData.push({
                    date: dateStr,
                    count: 0,
                    active: 0,
                    unsubscribed: 0,
                    bounced: 0,
                    complained: 0,
                });
            }
        }

        // Sort by date (just to be extra safe)
        dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));

        return res.status(200).json({
            dailyData,
            totalDays: days,
        });
    } catch (error) {
        console.error('Error getting daily contacts stats:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
