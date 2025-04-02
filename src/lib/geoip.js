// src/lib/geoip.js
import fs from 'fs';
import path from 'path';

let cityReader = null;
let countryReader = null;
let readerInitialized = false;
let initializationError = null;

/**
 * Initialize GeoIP readers asynchronously
 */
async function initializeReaders() {
    if (readerInitialized) return;

    try {
        // Dynamic import for ESM compatibility with Next.js
        const maxmind = await import('@maxmind/geoip2-node');

        // Paths to your GeoLite2 database files
        const cityDbPath = path.resolve(process.cwd(), 'data/GeoLite2-City.mmdb');
        const countryDbPath = path.resolve(process.cwd(), 'data/GeoLite2-Country.mmdb');

        // Check if the files exist
        if (fs.existsSync(cityDbPath)) {
            try {
                // The correct method is maxmind.Reader.open not Reader.open
                cityReader = await maxmind.Reader.open(cityDbPath);
                console.log('City database loaded successfully');
            } catch (error) {
                console.error('Failed to open City database:', error);
            }
        } else {
            console.warn('City database file not found at:', cityDbPath);
        }

        if (fs.existsSync(countryDbPath)) {
            try {
                countryReader = await maxmind.Reader.open(countryDbPath);
                console.log('Country database loaded successfully');
            } catch (error) {
                console.error('Failed to open Country database:', error);
            }
        } else {
            console.warn('Country database file not found at:', countryDbPath);
        }

        if (!cityReader && !countryReader) {
            console.warn('GeoLite2 database files not found. Geolocation features will be disabled.');
        }
    } catch (error) {
        console.error('Failed to initialize GeoIP databases:', error);
        initializationError = error;
    } finally {
        readerInitialized = true;
    }
}

// Initialize when the module is loaded
initializeReaders();

/**
 * Look up geolocation data for an IP address
 * @param {string} ipAddress - The IP address to look up
 * @returns {Object} Geolocation data
 */
export async function getGeoData(ipAddress) {
    // Make sure readers are initialized
    if (!readerInitialized) {
        await initializeReaders();
    }

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

    // If initialization failed or readers aren't available, return unknown data
    if (initializationError || (!cityReader && !countryReader)) {
        console.warn(`GeoIP lookup skipped for IP ${ipAddress} - databases not available`);
        return {
            country: 'Unknown',
            countryCode: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'Unknown',
        };
    }

    try {
        // Try to get city data first (more detailed)
        if (cityReader) {
            try {
                // Log the cityReader to debug
                console.log('City reader type:', typeof cityReader);
                console.log('City reader methods:', Object.keys(cityReader));

                // Try different methods that might exist
                let response;

                if (typeof cityReader.lookup === 'function') {
                    response = cityReader.lookup(ipAddress);
                } else if (typeof cityReader.city === 'function') {
                    response = cityReader.city(ipAddress);
                } else {
                    // If neither method exists, try a direct function call if possible
                    response = cityReader(ipAddress);
                }

                return {
                    country: response.country?.names?.en || 'Unknown',
                    countryCode: response.country?.isoCode || 'XX',
                    region: response.subdivisions?.[0]?.names?.en || 'Unknown',
                    city: response.city?.names?.en || 'Unknown',
                    timezone: response.location?.timeZone || 'Unknown',
                    latitude: response.location?.latitude,
                    longitude: response.location?.longitude,
                };
            } catch (cityError) {
                console.warn(`City lookup failed for IP ${ipAddress}:`, cityError.message);
                // Fall through to country lookup
            }
        }

        // Fall back to country data if city database isn't available or lookup failed
        if (countryReader) {
            try {
                // Try different methods that might exist
                let response;

                if (typeof countryReader.lookup === 'function') {
                    response = countryReader.lookup(ipAddress);
                } else if (typeof countryReader.country === 'function') {
                    response = countryReader.country(ipAddress);
                } else {
                    // If neither method exists, try a direct function call if possible
                    response = countryReader(ipAddress);
                }

                return {
                    country: response.country?.names?.en || 'Unknown',
                    countryCode: response.country?.isoCode || 'XX',
                    region: 'Unknown',
                    city: 'Unknown',
                    timezone: 'Unknown',
                };
            } catch (countryError) {
                console.warn(`Country lookup failed for IP ${ipAddress}:`, countryError.message);
            }
        }

        // Fallback for when databases aren't available or lookups fail
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
