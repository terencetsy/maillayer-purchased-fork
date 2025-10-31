// src/pages/api/tracking/sequence-click.js
import { trackSequenceEvent } from '@/services/sequenceLogService';
import { getGeoData } from '@/lib/geoip';

export default async function handler(req, res) {
    // Handle OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only support GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { sid: sequenceId, eid: enrollmentId, e: email, t: token, url } = req.query;

        // Debug info
        console.log('Sequence click tracking request received:', {
            sequenceId,
            enrollmentId,
            email,
            url,
        });

        // If URL is missing, redirect to homepage
        if (!url) {
            console.warn('Missing URL parameter in sequence click tracking');
            return res.redirect(302, '/');
        }

        // Decode the URL
        const decodedUrl = decodeURIComponent(url);

        // If tracking params are missing, just redirect without tracking
        if (!sequenceId || !enrollmentId || !email || !token) {
            console.warn('Missing required parameters for sequence click tracking');
            return res.redirect(302, decodedUrl);
        }

        // Verify token
        const crypto = require('crypto');
        const dataToHash = `${sequenceId}:${enrollmentId}:${email}:${process.env.TRACKING_SECRET || 'tracking-secret-key'}`;
        const expectedToken = crypto.createHash('sha256').update(dataToHash).digest('hex');

        if (token !== expectedToken) {
            console.warn('Invalid tracking token for sequence click');
            return res.redirect(302, decodedUrl);
        }

        // Get the IP address
        const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.socket.remoteAddress;
        const cleanIp = ipAddress?.replace(/^::ffff:/, '') || 'unknown';

        // Get geo data (fast since it's local)
        const geoData = await getGeoData(cleanIp);

        // Track the click event (don't await to make redirect faster)
        trackSequenceEvent(sequenceId, enrollmentId, 'click', {
            url: decodedUrl,
            email,
            geolocation: geoData,
            ipAddress: cleanIp,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
        }).catch((error) => {
            console.error('Error tracking sequence click:', error);
        });

        console.log('Tracked sequence click, redirecting to:', decodedUrl);

        // Redirect to the original URL immediately
        return res.redirect(302, decodedUrl);
    } catch (error) {
        console.error('Error in sequence click tracking:', error);
        // Try to redirect to URL if available
        const url = req.query.url;
        if (url) {
            return res.redirect(302, decodeURIComponent(url));
        }
        return res.redirect(302, '/');
    }
}
