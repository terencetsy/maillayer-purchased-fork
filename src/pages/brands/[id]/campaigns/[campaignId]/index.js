import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Mail, MousePointer, AlertTriangle, Filter, Download, MailX, Users, Eye, X, Clock, Calendar, Send, Globe, MapPin, Smartphone, Server, ChevronDown } from 'lucide-react';
import { formatDistance } from 'date-fns';
import GeoBarChart from '@/components/campaign/GeoBarChart';

export default function CampaignDetail() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, campaignId } = router.query;

    const [brand, setBrand] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // For events
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Geographic & Device Insights
    const [geoData, setGeoData] = useState({
        countries: [],
        cities: [],
        devices: [],
        browsers: [],
        operatingSystems: [],
        totalEvents: 0,
        appliedFilter: null,
    });
    const [activeGeoTab, setActiveGeoTab] = useState('location');
    const [mapView, setMapView] = useState('countries');
    const [geoLoading, setGeoLoading] = useState(true);
    const [eventTypeFilter, setEventTypeFilter] = useState('open');
    const [showGeoFilters, setShowGeoFilters] = useState(false);

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

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    // Filters
    const [filters, setFilters] = useState({
        eventType: '',
        email: '',
        sort: 'timestamp',
        order: 'desc',
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && campaignId) {
            fetchBrandDetails();
            fetchCampaignDetails();
        }
    }, [status, id, campaignId, router]);

    useEffect(() => {
        if (campaign && campaign.status !== 'draft') {
            fetchCampaignStats();
            fetchCampaignEvents();
            fetchGeoStats();
        }
    }, [campaign]);

    useEffect(() => {
        if (campaign && campaign.status !== 'draft') {
            fetchCampaignEvents();
        }
    }, [pagination.page, filters]);

    useEffect(() => {
        if (campaign && campaign.status !== 'draft') {
            fetchGeoStats();
        }
    }, [eventTypeFilter]);

    const fetchBrandDetails = async () => {
        try {
            const res = await fetch(`/api/brands/${id}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Brand not found');
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch brand details');
                }
            }

            const data = await res.json();
            setBrand(data);
        } catch (error) {
            console.error('Error fetching brand details:', error);
            setError(error.message);
        }
    };

    const fetchCampaignDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/campaigns/${campaignId}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Campaign not found');
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch campaign details');
                }
            }

            const data = await res.json();
            setCampaign(data);
        } catch (error) {
            console.error('Error fetching campaign details:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCampaignStats = async () => {
        try {
            const res = await fetch(`/api/brands/${id}/campaigns/${campaignId}/stats`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch campaign stats');
            }

            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching campaign stats:', error);
        }
    };

    const fetchGeoStats = async () => {
        try {
            setGeoLoading(true);

            let url = `/api/brands/${id}/campaigns/${campaignId}/geostats`;
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
        } catch (error) {
            console.error('Error fetching geo statistics:', error);
        } finally {
            setGeoLoading(false);
        }
    };

    const fetchCampaignEvents = async () => {
        try {
            setEventsLoading(true);

            const queryParams = new URLSearchParams({
                events: 'true',
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
            });

            const response = await fetch(`/api/brands/${id}/campaigns/${campaignId}/stats?${queryParams}`, {
                credentials: 'same-origin',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to fetch events');
            }

            const data = await response.json();
            setEvents(data.events || []);
            setPagination((prev) => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 1,
            }));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setEventsLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));

        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));
    };

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({
            ...prev,
            page: newPage,
        }));
    };

    const exportEvents = async () => {
        alert('Export functionality would be implemented here');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatEventType = (type) => {
        const iconProps = { size: 14 };

        switch (type) {
            case 'open':
                return {
                    label: 'Open',
                    icon: <Mail {...iconProps} />,
                    className: 'event-open',
                };
            case 'click':
                return {
                    label: 'Click',
                    icon: <MousePointer {...iconProps} />,
                    className: 'event-click',
                };
            case 'bounce':
                return {
                    label: 'Bounce',
                    icon: <X {...iconProps} />,
                    className: 'event-bounce',
                };
            case 'complaint':
                return {
                    label: 'Complaint',
                    icon: <AlertTriangle {...iconProps} />,
                    className: 'event-complaint',
                };
            case 'delivery':
                return {
                    label: 'Delivery',
                    icon: <Mail {...iconProps} />,
                    className: 'event-delivery',
                };
            case 'unsubscribe':
                return {
                    label: 'Unsubscribe',
                    icon: <MailX {...iconProps} />,
                    className: 'event-unsubscribe',
                };
            default:
                return { label: type, icon: null, className: '' };
        }
    };

    // Transform geo data for ContactsBarChart
    const getChartData = () => {
        if (activeGeoTab === 'location') {
            const data = mapView === 'countries' ? geoData.countries : geoData.cities;
            return data.slice(0, 15).map((item) => ({
                date: item.name,
                value: item.value,
            }));
        } else if (activeGeoTab === 'devices') {
            return geoData.devices.map((item) => ({
                date: item.name,
                value: item.value,
            }));
        } else if (activeGeoTab === 'browsers') {
            return geoData.browsers.slice(0, 15).map((item) => ({
                date: item.name,
                value: item.value,
            }));
        } else if (activeGeoTab === 'os') {
            return geoData.operatingSystems.slice(0, 15).map((item) => ({
                date: item.name,
                value: item.value,
            }));
        }
        return [];
    };

    const getChartTitle = () => {
        if (activeGeoTab === 'location') {
            return mapView === 'countries' ? 'Top Countries' : 'Top Cities';
        } else if (activeGeoTab === 'devices') {
            return 'Device Types';
        } else if (activeGeoTab === 'browsers') {
            return 'Browser Types';
        } else if (activeGeoTab === 'os') {
            return 'Operating Systems';
        }
        return 'Data';
    };

    if (isLoading || !brand || !campaign) {
        return (
            <BrandLayout brand={brand}>
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>Loading campaign details...</p>
                </div>
            </BrandLayout>
        );
    }

    if (error) {
        return (
            <BrandLayout brand={brand}>
                <div className="alert alert--error">
                    <span>{error}</span>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="campaign-detail">
                {/* Navigation */}
                <div className="campaign-detail__nav">
                    <Link href={`/brands/${id}/campaigns`} className="back-link">
                        <ArrowLeft size={16} />
                        <span>Back to campaigns</span>
                    </Link>

                    <div className="campaign-detail__header">
                        <div className="campaign-detail__title-row">
                            <h1 className="campaign-detail__title">{campaign.name}</h1>
                            <span className={`status-badge ${campaign.status}`}>
                                {campaign.status === 'draft' ? 'Draft' : campaign.status === 'sending' ? 'Sending' : campaign.status === 'sent' ? 'Sent' : campaign.status === 'scheduled' ? 'Scheduled' : campaign.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Campaign Overview Card */}
                <div className="detail-card">
                    <div className="detail-card__header">
                        <Mail size={18} />
                        <h2>Campaign Overview</h2>
                    </div>

                    <div className="detail-card__grid">
                        <div className="detail-card__item">
                            <span className="detail-card__label">Subject</span>
                            <span className="detail-card__value">{campaign.subject}</span>
                        </div>

                        <div className="detail-card__item">
                            <span className="detail-card__label">
                                <Calendar size={14} />
                                Created
                            </span>
                            <span className="detail-card__value">{formatDate(campaign.createdAt)}</span>
                        </div>

                        <div className="detail-card__item">
                            <span className="detail-card__label">
                                <Send size={14} />
                                Sent
                            </span>
                            <span className="detail-card__value">{formatDate(campaign.sentAt) || 'Not sent yet'}</span>
                        </div>

                        <div className="detail-card__item">
                            <span className="detail-card__label">
                                <Users size={14} />
                                Recipients
                            </span>
                            <span className="detail-card__value">{campaign.stats?.recipients || 0} contacts</span>
                        </div>

                        <div className="detail-card__item">
                            <span className="detail-card__label">From</span>
                            <span className="detail-card__value">
                                {campaign.fromName || brand.name} &lt;{campaign.fromEmail || brand.fromEmail || 'Not set'}&gt;
                            </span>
                        </div>

                        <div className="detail-card__item detail-card__item--action">
                            <button className="button button--secondary button--small" onClick={() => setShowPreviewModal(true)}>
                                <Eye size={14} />
                                <span>Preview Email</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                {campaign.status !== 'draft' && (
                    <>
                        <div className="stats-section">
                            <h2 className="section-title">Campaign Performance</h2>

                            {!stats ? (
                                <div className="loading-section">
                                    <div className="spinner"></div>
                                    <p>Loading statistics...</p>
                                </div>
                            ) : (
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-card__icon stat-card__icon--blue">
                                            <Mail size={20} />
                                        </div>
                                        <div className="stat-card__content">
                                            <div className="stat-card__value">{stats.recipients || 0}</div>
                                            <div className="stat-card__label">Recipients</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-card__icon stat-card__icon--green">
                                            <Mail size={20} />
                                        </div>
                                        <div className="stat-card__content">
                                            <div className="stat-card__value">{stats.open?.unique || 0}</div>
                                            <div className="stat-card__label">Unique Opens</div>
                                            <div className="stat-card__sub">{stats.openRate || 0}% open rate</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-card__icon stat-card__icon--yellow">
                                            <MousePointer size={20} />
                                        </div>
                                        <div className="stat-card__content">
                                            <div className="stat-card__value">{stats.click?.unique || 0}</div>
                                            <div className="stat-card__label">Unique Clicks</div>
                                            <div className="stat-card__sub">{stats.clickRate || 0}% click rate</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-card__icon stat-card__icon--gray">
                                            <Users size={20} />
                                        </div>
                                        <div className="stat-card__content">
                                            <div className="stat-card__value">{stats.unsubscribed?.total || 0}</div>
                                            <div className="stat-card__label">Unsubscribes</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-card__icon stat-card__icon--red">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="stat-card__content">
                                            <div className="stat-card__value">{stats.bounce?.total || 0}</div>
                                            <div className="stat-card__label">Bounces</div>
                                            <div className="stat-card__sub">{stats.recipients ? (((stats.bounce?.total || 0) / stats.recipients) * 100).toFixed(1) : 0}% bounce rate</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Geographic & Device Insights */}
                        <div className="geo-section">
                            <div className="geo-section__header">
                                <h2 className="section-title">
                                    <Globe size={20} />
                                    Geographic & Device Insights
                                </h2>

                                <button className="button button--secondary button--small" onClick={() => setShowGeoFilters(!showGeoFilters)}>
                                    <Filter size={14} />
                                    <span>Filter</span>
                                    <ChevronDown size={14} className={`chevron ${showGeoFilters ? 'chevron--open' : ''}`} />
                                </button>
                            </div>

                            {showGeoFilters && (
                                <div className="filter-panel">
                                    <div className="filter-panel__row">
                                        <div className="filter-panel__field">
                                            <label className="filter-panel__label">Event Type</label>
                                            <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="form-select">
                                                {eventTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {eventTypeFilter && (
                                            <div className="filter-panel__active">
                                                <span className="filter-panel__active-label">Active:</span>
                                                <span className="filter-panel__active-value">{eventTypes.find((t) => t.value === eventTypeFilter)?.label}</span>
                                                <button onClick={() => setEventTypeFilter('')} className="filter-panel__clear">
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="geo-tabs">
                                <button onClick={() => setActiveGeoTab('location')} className={`geo-tab ${activeGeoTab === 'location' ? 'geo-tab--active' : ''}`}>
                                    <Globe size={16} />
                                    <span>Location</span>
                                </button>
                                <button onClick={() => setActiveGeoTab('devices')} className={`geo-tab ${activeGeoTab === 'devices' ? 'geo-tab--active' : ''}`}>
                                    <Smartphone size={16} />
                                    <span>Devices</span>
                                </button>
                                <button onClick={() => setActiveGeoTab('browsers')} className={`geo-tab ${activeGeoTab === 'browsers' ? 'geo-tab--active' : ''}`}>
                                    <Globe size={16} />
                                    <span>Browsers</span>
                                </button>
                                <button onClick={() => setActiveGeoTab('os')} className={`geo-tab ${activeGeoTab === 'os' ? 'geo-tab--active' : ''}`}>
                                    <Server size={16} />
                                    <span>OS</span>
                                </button>
                            </div>

                            {/* Location Tab - Toggle between Countries/Cities */}
                            {activeGeoTab === 'location' && (
                                <div className="geo-toggle">
                                    <button onClick={() => setMapView('countries')} className={`button button--small ${mapView === 'countries' ? 'button--primary' : 'button--secondary'}`}>
                                        <Globe size={14} />
                                        <span>Countries</span>
                                    </button>
                                    <button onClick={() => setMapView('cities')} className={`button button--small ${mapView === 'cities' ? 'button--primary' : 'button--secondary'}`}>
                                        <MapPin size={14} />
                                        <span>Cities</span>
                                    </button>
                                </div>
                            )}

                            {/* Chart */}
                            {geoLoading ? (
                                <div className="loading-section">
                                    <div className="spinner"></div>
                                    <p>Loading geographic insights...</p>
                                </div>
                            ) : geoData.totalEvents === 0 ? (
                                <div className="empty-state">
                                    <Globe size={24} />
                                    <p>No location data available{eventTypeFilter ? ` for ${eventTypeFilter} events` : ''}</p>
                                    {eventTypeFilter && (
                                        <button className="button button--secondary button--small" onClick={() => setEventTypeFilter('')}>
                                            Clear filter
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <GeoBarChart data={getChartData()} title={getChartTitle()} totalLabel="events" type={activeGeoTab === 'location' ? (mapView === 'countries' ? 'countries' : 'cities') : activeGeoTab} />
                            )}
                        </div>

                        {/* Events Section */}
                        <div className="events-section">
                            <div className="events-section__header">
                                <h2 className="section-title">
                                    <Clock size={20} />
                                    Email Activity
                                </h2>

                                <div className="events-section__actions">
                                    <button className="button button--secondary button--small" onClick={() => setShowFilters(!showFilters)}>
                                        <Filter size={14} />
                                        <span>Filter</span>
                                    </button>

                                    <button className="button button--secondary button--small" onClick={exportEvents}>
                                        <Download size={14} />
                                        <span>Export</span>
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            {showFilters && (
                                <div className="filter-panel filter-panel--grid">
                                    <div className="filter-panel__field">
                                        <label className="filter-panel__label">Event Type</label>
                                        <select name="eventType" value={filters.eventType} onChange={handleFilterChange} className="form-select">
                                            <option value="">All Events</option>
                                            <option value="open">Opens</option>
                                            <option value="click">Clicks</option>
                                            <option value="bounce">Bounces</option>
                                            <option value="complaint">Complaints</option>
                                            <option value="delivery">Deliveries</option>
                                        </select>
                                    </div>

                                    <div className="filter-panel__field">
                                        <label className="filter-panel__label">Email Address</label>
                                        <input type="text" name="email" value={filters.email} onChange={handleFilterChange} placeholder="Filter by email" className="form-input" />
                                    </div>

                                    <div className="filter-panel__field">
                                        <label className="filter-panel__label">Sort By</label>
                                        <select name="sort" value={filters.sort} onChange={handleFilterChange} className="form-select">
                                            <option value="timestamp">Date/Time</option>
                                            <option value="email">Email</option>
                                            <option value="eventType">Event Type</option>
                                        </select>
                                    </div>

                                    <div className="filter-panel__field">
                                        <label className="filter-panel__label">Order</label>
                                        <select name="order" value={filters.order} onChange={handleFilterChange} className="form-select">
                                            <option value="desc">Newest First</option>
                                            <option value="asc">Oldest First</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Events Table */}
                            {eventsLoading ? (
                                <div className="loading-section">
                                    <div className="spinner"></div>
                                    <p>Loading events...</p>
                                </div>
                            ) : events.length > 0 ? (
                                <>
                                    <div className="events-table-wrapper">
                                        <table className="campaigns-table">
                                            <thead>
                                                <tr>
                                                    <th>Event</th>
                                                    <th>Email</th>
                                                    <th>Date/Time</th>
                                                    <th>Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {events.map((event, index) => {
                                                    const eventInfo = formatEventType(event.eventType || event.type);
                                                    return (
                                                        <tr key={event._id || index}>
                                                            <td>
                                                                <div className={`event-type ${eventInfo.className}`}>
                                                                    {eventInfo.icon}
                                                                    <span>{eventInfo.label}</span>
                                                                </div>
                                                            </td>
                                                            <td>{event.email}</td>
                                                            <td>
                                                                <span title={new Date(event.timestamp).toLocaleString()}>{formatDistance(new Date(event.timestamp), new Date(), { addSuffix: true })}</span>
                                                            </td>
                                                            <td>
                                                                {(event.eventType === 'click' || event.type === 'click') && (event.metadata?.url || event.url) && (
                                                                    <span className="event-detail" title={event.metadata?.url || event.url}>
                                                                        {(event.metadata?.url || event.url).length > 50 ? `${(event.metadata?.url || event.url).substring(0, 50)}...` : event.metadata?.url || event.url}
                                                                    </span>
                                                                )}
                                                                {(event.eventType === 'bounce' || event.type === 'bounce') && (
                                                                    <span className="event-detail">
                                                                        {event.metadata?.bounceType || event.reason || 'Bounce'}
                                                                        {event.metadata?.diagnosticCode ? ` - ${event.metadata.diagnosticCode}` : ''}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {pagination.totalPages > 1 && (
                                        <div className="events-pagination">
                                            <button className="button button--secondary button--small" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
                                                <span>Previous</span>
                                            </button>

                                            <span className="events-pagination__text">
                                                Page {pagination.page} of {pagination.totalPages}
                                            </span>

                                            <button className="button button--secondary button--small" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                                                <span>Next</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <p>No events have been recorded for this campaign yet.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Email Preview Modal */}
                {showPreviewModal && (
                    <div className="preview-modal-overlay">
                        <div className="preview-modal">
                            <div className="preview-modal__header">
                                <h2>Email Preview</h2>
                                <button className="preview-modal__close" onClick={() => setShowPreviewModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="preview-modal__body">
                                <div className="preview-modal__subject">
                                    <span className="preview-modal__subject-label">Subject:</span>
                                    <span className="preview-modal__subject-value">{campaign.subject}</span>
                                </div>
                                <div className="preview-modal__content" dangerouslySetInnerHTML={{ __html: campaign.content || '<p>No content available.</p>' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </BrandLayout>
    );
}
