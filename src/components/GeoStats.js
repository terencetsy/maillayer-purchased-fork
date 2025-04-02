import React, { useState, useEffect } from 'react';
import { Globe, MapPin, TrendingUp } from 'lucide-react';

const GeoStats = ({ events }) => {
    const [geoData, setGeoData] = useState({
        countries: {},
        cities: {},
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!events || events.length === 0) {
            setGeoData((prev) => ({ ...prev, loading: false }));
            return;
        }

        // Process events to extract geolocation data
        try {
            const countries = {};
            const cities = {};

            events.forEach((event) => {
                if (event.metadata?.geolocation) {
                    const geo = event.metadata.geolocation;

                    // Count countries
                    const country = geo.country || 'Unknown';
                    countries[country] = (countries[country] || 0) + 1;

                    // Count cities
                    const city = geo.city ? `${geo.city}, ${geo.countryCode}` : 'Unknown';
                    cities[city] = (cities[city] || 0) + 1;
                }
            });

            setGeoData({
                countries: countries,
                cities: cities,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error('Error processing geo data:', error);
            setGeoData((prev) => ({
                ...prev,
                loading: false,
                error: 'Failed to process location data',
            }));
        }
    }, [events]);

    // Sort locations by count (highest first)
    const sortedCountries = Object.entries(geoData.countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 countries

    const sortedCities = Object.entries(geoData.cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 cities

    // Calculate total events with geo data
    const totalGeoEvents = Object.values(geoData.countries).reduce((sum, count) => sum + count, 0);

    if (geoData.loading) {
        return (
            <div className="geo-stats-loading">
                <div className="spinner-small"></div>
                <p>Loading location data...</p>
            </div>
        );
    }

    if (geoData.error) {
        return (
            <div className="geo-stats-error">
                <p>Error: {geoData.error}</p>
            </div>
        );
    }

    if (totalGeoEvents === 0) {
        return (
            <div className="geo-stats-empty">
                <Globe size={24} />
                <p>No location data available yet</p>
            </div>
        );
    }

    return (
        <div className="geo-stats-container">
            <div className="geo-stats-header">
                <Globe size={20} />
                <h3>Geographic Insights</h3>
            </div>

            <div className="geo-stats-grid">
                <div className="geo-stats-card">
                    <div className="geo-card-header">
                        <Globe size={16} />
                        <h4>Top Countries</h4>
                    </div>
                    <div className="geo-card-content">
                        <ul className="geo-list">
                            {sortedCountries.map(([country, count], index) => (
                                <li
                                    key={country}
                                    className="geo-list-item"
                                >
                                    <span className="geo-location">
                                        <span className="geo-index">{index + 1}.</span>
                                        <span className="geo-name">{country}</span>
                                    </span>
                                    <span className="geo-count">
                                        <span className="geo-number">{count}</span>
                                        <span className="geo-percentage">({Math.round((count / totalGeoEvents) * 100)}%)</span>
                                    </span>
                                </li>
                            ))}

                            {sortedCountries.length === 0 && <li className="geo-empty">No country data available</li>}
                        </ul>
                    </div>
                </div>

                <div className="geo-stats-card">
                    <div className="geo-card-header">
                        <MapPin size={16} />
                        <h4>Top Cities</h4>
                    </div>
                    <div className="geo-card-content">
                        <ul className="geo-list">
                            {sortedCities.map(([city, count], index) => (
                                <li
                                    key={city}
                                    className="geo-list-item"
                                >
                                    <span className="geo-location">
                                        <span className="geo-index">{index + 1}.</span>
                                        <span className="geo-name">{city}</span>
                                    </span>
                                    <span className="geo-count">
                                        <span className="geo-number">{count}</span>
                                        <span className="geo-percentage">({Math.round((count / totalGeoEvents) * 100)}%)</span>
                                    </span>
                                </li>
                            ))}

                            {sortedCities.length === 0 && <li className="geo-empty">No city data available</li>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeoStats;
