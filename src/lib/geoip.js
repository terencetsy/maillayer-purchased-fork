// lib/geoip.js
import { Reader } from '@maxmind/geoip2-node';
import path from 'path';
import fs from 'fs';

let cityReader = null;
let countryReader = null;

// Initialize the GeoIP readers
try {
    // Paths to your GeoLite2 database files
    const cityDbPath = path.resolve(process.cwd(), 'data/GeoLite2-City.mmdb');
    const countryDbPath = path.resolve(process.cwd(), 'data/GeoLite2-Country.mmdb');

    // Check if the files exist
    if (fs.existsSync(cityDbPath)) {
        cityReader = Reader.openSync(cityDbPath);
    }

    if (fs.existsSync(countryDbPath)) {
        countryReader = Reader.openSync(countryDbPath);
    }

    if (!cityReader && !countryReader) {
        console.warn('GeoLite2 database files not found. Geolocation features will be disabled.');
    }
} catch (error) {
    console.error('Failed to initialize GeoIP databases:', error);
}

/**
 * Look up geolocation data for an IP address
 * @param {string} ipAddress - The IP address to look up
 * @returns {Object} Geolocation data
 */
export function getGeoData(ipAddress) {
    // Skip private or invalid IPs
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === 'localhost' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.16.') || ipAddress.startsWith('::1')) {
        return {
            country: 'Local',
            countryCode: 'XX',
            region: 'Local',
            city: 'Local',
            timezone: 'Unknown',
        };
    }

    try {
        // Try to get city data first (more detailed)
        if (cityReader) {
            const response = cityReader.city(ipAddress);

            return {
                country: response.country?.names?.en || 'Unknown',
                countryCode: response.country?.isoCode || 'XX',
                region: response.subdivisions?.[0]?.names?.en || 'Unknown',
                city: response.city?.names?.en || 'Unknown',
                timezone: response.location?.timeZone || 'Unknown',
                latitude: response.location?.latitude,
                longitude: response.location?.longitude,
            };
        }

        // Fall back to country data if city database isn't available
        if (countryReader) {
            const response = countryReader.country(ipAddress);

            return {
                country: response.country?.names?.en || 'Unknown',
                countryCode: response.country?.isoCode || 'XX',
                region: 'Unknown',
                city: 'Unknown',
                timezone: 'Unknown',
            };
        }

        // If neither database is available
        return {
            country: 'Unknown',
            countryCode: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'Unknown',
        };
    } catch (error) {
        console.warn(`GeoIP lookup failed for IP ${ipAddress}:`, error.message);
        return {
            country: 'Unknown',
            countryCode: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'Unknown',
        };
    }
}
