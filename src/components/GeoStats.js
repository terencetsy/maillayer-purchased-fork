import React, { useState, useEffect } from 'react';
import { Globe, MapPin, TrendingUp, Smartphone, Monitor, Tablet, Server, Filter, ChevronDown } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const GeoStats = ({ campaignId, brandId }) => {
    const [geoData, setGeoData] = useState({
        countries: [],
        cities: [],
        devices: [],
        browsers: [],
        operatingSystems: [],
        totalEvents: 0,
        appliedFilter: null,
    });

    const [activeTab, setActiveTab] = useState('location');
    const [mapView, setMapView] = useState('countries');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventTypeFilter, setEventTypeFilter] = useState('open');
    const [showFilters, setShowFilters] = useState(false);

    // Event types for filtering
    const eventTypes = [
        { value: '', label: 'All Events' },
        { value: 'open', label: 'Opens' },
        { value: 'click', label: 'Clicks' },
        { value: 'delivery', label: 'Deliveries' },
        { value: 'bounce', label: 'Bounces' },
        { value: 'complaint', label: 'Complaints' },
        { value: 'unsubscribe', label: 'Unsubscribes' },
    ];

    // Color schemes for charts
    const COUNTRY_COLORS = ['#5d87ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#84cc16', '#eab308'];
    const DEVICE_COLORS = ['#5d87ff', '#10b981', '#f59e0b', '#ef4444'];

    useEffect(() => {
        if (!campaignId || !brandId) {
            setLoading(false);
            return;
        }

        fetchGeoStats();
    }, [campaignId, brandId, eventTypeFilter]);

    const fetchGeoStats = async () => {
        try {
            setLoading(true);

            // Build URL with optional eventType filter
            let url = `/api/brands/${brandId}/campaigns/${campaignId}/geostats`;
            if (eventTypeFilter) {
                url += `?eventType=${eventTypeFilter}`;
            }

            const response = await fetch(url, {
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch geo statistics');
            }

            const data = await response.json();
            setGeoData(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching geo statistics:', error);
            setError('Failed to load geographic insights');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setEventTypeFilter(e.target.value);
    };

    // Format country/city data for bar charts
    const countryBarData = geoData.countries.slice(0, 10);
    const cityBarData = geoData.cities.slice(0, 10);

    const renderDeviceIcon = (device) => {
        switch (device) {
            case 'Mobile':
                return <Smartphone size={16} />;
            case 'Desktop':
                return <Monitor size={16} />;
            case 'Tablet':
                return <Tablet size={16} />;
            default:
                return <Server size={16} />;
        }
    };

    if (loading) {
        return (
            <div className="geo-stats-loading">
                <div className="spinner-small"></div>
                <p>Loading geographic insights...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="geo-stats-error">
                <p>Error: {error}</p>
            </div>
        );
    }

    if (geoData.totalEvents === 0) {
        return (
            <div className="geo-stats-empty">
                <Globe size={24} />
                <p>No location data available{eventTypeFilter ? ` for ${eventTypeFilter} events` : ''}</p>
                {eventTypeFilter && (
                    <button
                        className="geo-clear-filter"
                        onClick={() => setEventTypeFilter('')}
                    >
                        Clear filter
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="geo-stats-container">
            <div className="geo-stats-header">
                <div className="geo-stats-title">
                    <Globe size={20} />
                    <h3>Geographic & Device Insights</h3>
                </div>

                <div className="geo-stats-actions">
                    <button
                        className="geo-filter-button"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={14} />
                        <span>Filter</span>
                        <ChevronDown
                            size={14}
                            className={`chevron ${showFilters ? 'rotate' : ''}`}
                        />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="geo-filter-container">
                    <div className="geo-filter-group">
                        <label htmlFor="eventTypeFilter">Event Type</label>
                        <select
                            id="eventTypeFilter"
                            value={eventTypeFilter}
                            onChange={handleFilterChange}
                            className="geo-filter-select"
                        >
                            {eventTypes.map((type) => (
                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {eventTypeFilter && (
                        <div className="geo-active-filter">
                            <span className="filter-label">Active Filter:</span>
                            <span className="filter-value">{eventTypes.find((t) => t.value === eventTypeFilter)?.label}</span>
                            <button
                                className="geo-clear-filter-btn"
                                onClick={() => setEventTypeFilter('')}
                                title="Clear filter"
                            >
                                <span>×</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="geo-stats-tabs">
                <button
                    className={`geo-tab ${activeTab === 'location' ? 'active' : ''}`}
                    onClick={() => setActiveTab('location')}
                >
                    <Globe size={16} />
                    <span>Location</span>
                </button>
                <button
                    className={`geo-tab ${activeTab === 'devices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('devices')}
                >
                    <Smartphone size={16} />
                    <span>Devices</span>
                </button>
                <button
                    className={`geo-tab ${activeTab === 'browsers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('browsers')}
                >
                    <Globe size={16} />
                    <span>Browsers</span>
                </button>
                <button
                    className={`geo-tab ${activeTab === 'os' ? 'active' : ''}`}
                    onClick={() => setActiveTab('os')}
                >
                    <Server size={16} />
                    <span>OS</span>
                </button>
            </div>

            {activeTab === 'location' && (
                <div className="geo-stats-content">
                    <div className="geo-view-toggle">
                        <button
                            className={`geo-view-button ${mapView === 'countries' ? 'active' : ''}`}
                            onClick={() => setMapView('countries')}
                        >
                            <Globe size={14} />
                            <span>Countries</span>
                        </button>
                        <button
                            className={`geo-view-button ${mapView === 'cities' ? 'active' : ''}`}
                            onClick={() => setMapView('cities')}
                        >
                            <MapPin size={14} />
                            <span>Cities</span>
                        </button>
                    </div>

                    <div className="geo-chart-container">
                        <div className="geo-chart">
                            <h4>{mapView === 'countries' ? 'Top Countries' : 'Top Cities'}</h4>
                            {(mapView === 'countries' ? countryBarData : cityBarData).length > 0 ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height={300}
                                >
                                    <BarChart
                                        data={mapView === 'countries' ? countryBarData : cityBarData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={70}
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="value"
                                            fill="#4682b4"
                                        >
                                            {(mapView === 'countries' ? countryBarData : cityBarData).map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="geo-no-data">No {mapView === 'countries' ? 'country' : 'city'} data available</div>
                            )}
                        </div>

                        <div className="geo-detail-list">
                            <div className="geo-card-header">
                                {mapView === 'countries' ? (
                                    <>
                                        <Globe size={16} />
                                        <h4>Country Breakdown</h4>
                                    </>
                                ) : (
                                    <>
                                        <MapPin size={16} />
                                        <h4>City Breakdown</h4>
                                    </>
                                )}
                            </div>
                            <div className="geo-card-content">
                                <ul className="geo-list">
                                    {(mapView === 'countries' ? geoData.countries : geoData.cities).slice(0, 15).map((item, index) => (
                                        <li
                                            key={item.name}
                                            className="geo-list-item"
                                        >
                                            <span className="geo-location">
                                                <span
                                                    className="geo-index"
                                                    style={{ backgroundColor: COUNTRY_COLORS[index % COUNTRY_COLORS.length] }}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="geo-name">{item.name}</span>
                                            </span>
                                            <span className="geo-count">
                                                <span className="geo-number">{item.value}</span>
                                                <span className="geo-percentage">({Math.round((item.value / geoData.totalEvents) * 100)}%)</span>
                                            </span>
                                        </li>
                                    ))}

                                    {(mapView === 'countries' ? geoData.countries : geoData.cities).length === 0 && <li className="geo-empty">No {mapView === 'countries' ? 'country' : 'city'} data available</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'devices' && (
                <div className="geo-stats-content">
                    <div className="geo-chart-container">
                        <div className="geo-chart">
                            <h4>Device Types</h4>
                            {geoData.devices.length > 0 ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height={300}
                                >
                                    <PieChart>
                                        <Pie
                                            data={geoData.devices}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                                        >
                                            {geoData.devices.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="geo-no-data">No device data available</div>
                            )}
                        </div>

                        <div className="geo-detail-list">
                            <div className="geo-card-header">
                                <Smartphone size={16} />
                                <h4>Device Breakdown</h4>
                            </div>
                            <div className="geo-card-content">
                                <ul className="geo-list">
                                    {geoData.devices.map((device, index) => {
                                        const percentage = geoData.totalEvents > 0 ? Math.round((device.value / geoData.totalEvents) * 100) : 0;
                                        return (
                                            <li
                                                key={device.name}
                                                className="geo-list-item device-item"
                                            >
                                                <span className="geo-location">
                                                    <span
                                                        className="geo-icon"
                                                        style={{ color: DEVICE_COLORS[index % DEVICE_COLORS.length] }}
                                                    >
                                                        {renderDeviceIcon(device.name)}
                                                    </span>
                                                    <span className="geo-name">{device.name}</span>
                                                </span>
                                                <span className="geo-count">
                                                    <span className="geo-number">{device.value}</span>
                                                    <span className="geo-percentage">({percentage}%)</span>
                                                </span>
                                            </li>
                                        );
                                    })}

                                    {geoData.devices.length === 0 && <li className="geo-empty">No device data available</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'browsers' && (
                <div className="geo-stats-content">
                    <div className="geo-chart-container">
                        <div className="geo-chart">
                            <h4>Browser Types</h4>
                            {geoData.browsers.length > 0 ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height={300}
                                >
                                    <PieChart>
                                        <Pie
                                            data={geoData.browsers}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                                        >
                                            {geoData.browsers.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="geo-no-data">No browser data available</div>
                            )}
                        </div>

                        <div className="geo-detail-list">
                            <div className="geo-card-header">
                                <Globe size={16} />
                                <h4>Browser Breakdown</h4>
                            </div>
                            <div className="geo-card-content">
                                <ul className="geo-list">
                                    {geoData.browsers.map((browser, index) => {
                                        const percentage = geoData.totalEvents > 0 ? Math.round((browser.value / geoData.totalEvents) * 100) : 0;
                                        return (
                                            <li
                                                key={browser.name}
                                                className="geo-list-item"
                                            >
                                                <span className="geo-location">
                                                    <span
                                                        className="geo-index"
                                                        style={{ backgroundColor: COUNTRY_COLORS[index % COUNTRY_COLORS.length] }}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    <span className="geo-name">{browser.name}</span>
                                                </span>
                                                <span className="geo-count">
                                                    <span className="geo-number">{browser.value}</span>
                                                    <span className="geo-percentage">({percentage}%)</span>
                                                </span>
                                            </li>
                                        );
                                    })}

                                    {geoData.browsers.length === 0 && <li className="geo-empty">No browser data available</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'os' && (
                <div className="geo-stats-content">
                    <div className="geo-chart-container">
                        <div className="geo-chart">
                            <h4>Operating Systems</h4>
                            {geoData.operatingSystems.length > 0 ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height={300}
                                >
                                    <PieChart>
                                        <Pie
                                            data={geoData.operatingSystems}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                                        >
                                            {geoData.operatingSystems.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="geo-no-data">No operating system data available</div>
                            )}
                        </div>

                        <div className="geo-detail-list">
                            <div className="geo-card-header">
                                <Server size={16} />
                                <h4>OS Breakdown</h4>
                            </div>
                            <div className="geo-card-content">
                                <ul className="geo-list">
                                    {geoData.operatingSystems.map((os, index) => {
                                        const percentage = geoData.totalEvents > 0 ? Math.round((os.value / geoData.totalEvents) * 100) : 0;
                                        return (
                                            <li
                                                key={os.name}
                                                className="geo-list-item"
                                            >
                                                <span className="geo-location">
                                                    <span
                                                        className="geo-index"
                                                        style={{ backgroundColor: COUNTRY_COLORS[index % COUNTRY_COLORS.length] }}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    <span className="geo-name">{os.name}</span>
                                                </span>
                                                <span className="geo-count">
                                                    <span className="geo-number">{os.value}</span>
                                                    <span className="geo-percentage">({percentage}%)</span>
                                                </span>
                                            </li>
                                        );
                                    })}

                                    {geoData.operatingSystems.length === 0 && <li className="geo-empty">No operating system data available</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeoStats;
