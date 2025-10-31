// src/pages/api/tracking/sequence-open.js
import { trackSequenceEvent } from '@/services/sequenceLogService';
import { getGeoData } from '@/lib/geoip';

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

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

    // Always send the GIF immediately to ensure it loads even if validation fails
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(TRANSPARENT_GIF);

    try {
        const { sid: sequenceId, eid: enrollmentId, e: email, t: token } = req.query;

        // Debug info
        console.log('Sequence open tracking request received:', {
            sequenceId,
            enrollmentId,
            email,
            tokenLength: token?.length,
        });

        // Basic validation
        if (!sequenceId || !enrollmentId || !email || !token) {
            console.warn('Missing required parameters for sequence tracking:', { sequenceId, enrollmentId, email });
            return; // Already sent GIF, so just return
        }

        // Verify token
        const crypto = require('crypto');
        const dataToHash = `${sequenceId}:${enrollmentId}:${email}:${process.env.TRACKING_SECRET || 'tracking-secret-key'}`;
        const expectedToken = crypto.createHash('sha256').update(dataToHash).digest('hex');

        if (token !== expectedToken) {
            console.warn('Invalid tracking token for sequence open:', {
                providedToken: token?.substring(0, 10) + '...',
                sequenceId,
                enrollmentId,
            });
            return; // Already sent GIF, so just return
        }

        // Process the tracking in the background (non-blocking)
        setTimeout(async () => {
            try {
                // Get the IP address
                const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.socket.remoteAddress;
                const cleanIp = ipAddress?.replace(/^::ffff:/, '') || 'unknown';

                // Get geo data if available
                const geoData = await getGeoData(cleanIp);

                // Track the open event
                await trackSequenceEvent(sequenceId, enrollmentId, 'open', {
                    email,
                    geolocation: geoData,
                    ipAddress: cleanIp,
                    userAgent: req.headers['user-agent'],
                    timestamp: new Date(),
                });

                console.log('Tracked sequence open:', {
                    sequenceId,
                    enrollmentId,
                    email,
                });
            } catch (err) {
                console.error('Background sequence tracking error:', err);
            }
        }, 0);
    } catch (error) {
        console.error('Error in sequence open tracking:', error);
    }
}
