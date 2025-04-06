// src/pages/api/brands/[brandId]/campaigns/[id]/geostats.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getCampaignById } from '@/services/campaignService';
import { getBrandById } from '@/services/brandService';
import mongoose from 'mongoose';
import { createTrackingModel } from '@/models/TrackingEvent'; // Import your dynamic model creator

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
        const { brandId, id } = req.query;

        // Get eventType filter from query params
        const eventType = req.query.eventType || null;

        if (!brandId || !id) {
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

        // Check if campaign exists and belongs to the user
        const campaign = await getCampaignById(id, userId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        if (campaign.brandId.toString() !== brandId) {
            return res.status(403).json({ message: 'Campaign does not belong to this brand' });
        }

        // GET request - get campaign geo stats
        if (req.method === 'GET') {
            try {
                // Get the campaign-specific Event model
                const Event = createTrackingModel(id);

                // Create a base filter that will be applied to all queries
                const baseFilter = eventType ? { eventType } : {};

                // Aggregate geographic data from events
                const geoData = {
                    countries: await getCountryStats(Event, baseFilter),
                    cities: await getCityStats(Event, baseFilter),
                    devices: await getDeviceStats(Event, baseFilter),
                    browsers: await getBrowserStats(Event, baseFilter),
                    operatingSystems: await getOSStats(Event, baseFilter),
                    totalEvents: await getTotalEvents(Event, baseFilter),
                    // Include the filter that was applied
                    appliedFilter: eventType ? { eventType } : null,
                };

                return res.status(200).json(geoData);
            } catch (error) {
                console.error('Error fetching geo stats:', error);
                return res.status(500).json({ message: 'Error fetching geo stats' });
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Helper function to get total events count with geo data
async function getTotalEvents(Event, baseFilter = {}) {
    return await Event.countDocuments({
        ...baseFilter,
        'metadata.geolocation': { $exists: true },
    });
}

// Helper function to get country statistics
async function getCountryStats(Event, baseFilter = {}) {
    const countries = await Event.aggregate([
        {
            $match: {
                ...baseFilter,
                'metadata.geolocation.country': { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: '$metadata.geolocation.country',
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                name: '$_id',
                value: '$count',
            },
        },
        {
            $sort: { value: -1 },
        },
    ]);

    // Handle "Unknown" countries
    const unknownCount = await Event.countDocuments({
        ...baseFilter,
        $or: [{ 'metadata.geolocation.country': { $exists: false } }, { 'metadata.geolocation.country': null }, { 'metadata.geolocation.country': 'Unknown' }],
    });

    if (unknownCount > 0) {
        countries.push({ name: 'Unknown', value: unknownCount });
    }

    return countries;
}

// Helper function to get city statistics
async function getCityStats(Event, baseFilter = {}) {
    const cities = await Event.aggregate([
        {
            $match: {
                ...baseFilter,
                'metadata.geolocation.city': { $exists: true, $ne: null, $ne: 'Unknown' },
            },
        },
        {
            $group: {
                _id: {
                    city: '$metadata.geolocation.city',
                    countryCode: '$metadata.geolocation.countryCode',
                },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                name: { $concat: ['$_id.city', ', ', '$_id.countryCode'] },
                value: '$count',
            },
        },
        {
            $sort: { value: -1 },
        },
    ]);

    // Handle "Unknown" cities
    const unknownCount = await Event.countDocuments({
        ...baseFilter,
        $or: [{ 'metadata.geolocation.city': { $exists: false } }, { 'metadata.geolocation.city': null }, { 'metadata.geolocation.city': 'Unknown' }],
    });

    if (unknownCount > 0) {
        cities.push({ name: 'Unknown', value: unknownCount });
    }

    return cities;
}

// Helper function to extract device type from user agent
function getDeviceType(userAgent) {
    if (!userAgent) return 'Unknown';

    if (/mobile|android|iphone|ipod/i.test(userAgent.toLowerCase())) {
        if (/ipad|tablet/i.test(userAgent.toLowerCase())) {
            return 'Tablet';
        }
        return 'Mobile';
    }
    return 'Desktop';
}

// Helper function to extract browser info from user agent
function getBrowserInfo(userAgent) {
    if (!userAgent) return 'Unknown';

    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge|edg/i.test(userAgent)) return 'Edge';
    if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
    if (/googleimageproxy/i.test(userAgent.toLowerCase())) return 'Email Client';

    return 'Other';
}

// Helper function to extract OS info from user agent
function getOperatingSystem(userAgent) {
    if (!userAgent) return 'Unknown';

    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';

    return 'Other';
}

// Helper function to get device statistics
async function getDeviceStats(Event, baseFilter = {}) {
    const events = await Event.find({
        ...baseFilter,
        userAgent: { $exists: true },
    }).select('userAgent');

    const devices = {};

    events.forEach((event) => {
        const deviceType = getDeviceType(event.userAgent);
        devices[deviceType] = (devices[deviceType] || 0) + 1;
    });

    // Convert to array format
    return Object.entries(devices)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

// Helper function to get browser statistics
async function getBrowserStats(Event, baseFilter = {}) {
    const events = await Event.find({
        ...baseFilter,
        userAgent: { $exists: true },
    }).select('userAgent');

    const browsers = {};

    events.forEach((event) => {
        const browser = getBrowserInfo(event.userAgent);
        browsers[browser] = (browsers[browser] || 0) + 1;
    });

    // Convert to array format
    return Object.entries(browsers)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

// Helper function to get OS statistics
async function getOSStats(Event, baseFilter = {}) {
    const events = await Event.find({
        ...baseFilter,
        userAgent: { $exists: true },
    }).select('userAgent');

    const operatingSystems = {};

    events.forEach((event) => {
        const os = getOperatingSystem(event.userAgent);
        operatingSystems[os] = (operatingSystems[os] || 0) + 1;
    });

    // Convert to array format
    return Object.entries(operatingSystems)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}
