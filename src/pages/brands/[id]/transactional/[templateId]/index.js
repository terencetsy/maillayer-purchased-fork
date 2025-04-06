import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Copy, Code, Eye, Edit, Play, Shield, Send, Mail, AlertCircle, Calendar, MousePointer, X, Filter, Download, ChevronLeft, ChevronRight, Clock, CheckCircle, BarChart2, Users, MailX, Globe, Smartphone, Laptop, Info } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, Area, AreaChart } from 'recharts';
import { formatDistance, format, subDays, isToday, isYesterday } from 'date-fns';
import APIDocsSection from '@/components/APIDocsSection';
import TemplatePreview from '@/components/TemplatePreview';

export default function TransactionalTemplateDetail() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, templateId } = router.query;

    // States for data
    const [brand, setBrand] = useState(null);
    const [template, setTemplate] = useState(null);
    const [stats, setStats] = useState(null);
    const [dailyStats, setDailyStats] = useState([]);
    const [logs, setLogs] = useState([]);
    const [events, setEvents] = useState([]);
    const [eventDistribution, setEventDistribution] = useState([]);
    const [deviceStats, setDeviceStats] = useState([]);
    const [topLocations, setTopLocations] = useState([]);
    const [geoStats, setGeoStats] = useState({ countries: [], cities: [] });
    const [timeStats, setTimeStats] = useState([]);
    const [dailySendStats, setDailySendStats] = useState([]);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [geoView, setGeoView] = useState('countries');
    const [dateRange, setDateRange] = useState('7d');

    // Filters
    const [filters, setFilters] = useState({
        eventType: '',
        email: '',
        sort: 'timestamp',
        order: 'desc',
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    // Chart colors
    const COLORS = ['#5d87ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const BLUE_GRADIENT = [
        { offset: 0, color: 'rgba(93, 135, 255, 0.3)' },
        { offset: 100, color: 'rgba(93, 135, 255, 0.05)' },
    ];

    // Fetch brand details
    const fetchBrandDetails = useCallback(async () => {
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
    }, [id]);

    // Fetch template details
    const fetchTemplateDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Template not found');
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch template details');
                }
            }

            const data = await res.json();
            setTemplate(data);
        } catch (error) {
            console.error('Error fetching template details:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [id, templateId]);

    // Fetch template statistics
    const fetchTemplateStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}/stats`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                console.warn('Could not fetch template stats');
                return;
            }

            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching template stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [id, templateId]);

    // Fetch daily stats
    const fetchDailyStats = useCallback(async () => {
        try {
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}/stats/daily`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                console.warn('Could not fetch daily stats');
                return;
            }

            const data = await res.json();
            setDailyStats(data.stats || []);

            // Generate daily send stats for the chart
            if (data.stats && data.stats.length > 0) {
                const days = parseInt(dateRange.replace('d', ''));
                const dailyData = [];
                const today = new Date();

                for (let i = days - 1; i >= 0; i--) {
                    const date = subDays(today, i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const statsForDay = data.stats.find((s) => s.date.startsWith(dateStr)) || {
                        date: dateStr,
                        sent: 0,
                        opens: 0,
                        clicks: 0,
                    };

                    let displayDate = format(date, 'MMM dd');
                    if (isToday(date)) displayDate = 'Today';
                    if (isYesterday(date)) displayDate = 'Yesterday';

                    dailyData.push({
                        date: dateStr,
                        displayDate,
                        sent: statsForDay.sent || 0,
                        opens: statsForDay.opens || 0,
                        clicks: statsForDay.clicks || 0,
                    });
                }

                setDailySendStats(dailyData);
            }
        } catch (error) {
            console.error('Error fetching daily stats:', error);
        }
    }, [id, templateId, dateRange]);

    // Fetch event logs
    const fetchEventLogs = useCallback(async () => {
        try {
            setEventsLoading(true);

            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
            });

            const res = await fetch(`/api/brands/${id}/transactional/${templateId}/events?${queryParams}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                console.warn('Could not fetch event logs');
                return;
            }

            const data = await res.json();
            setEvents(data.events || []);
            setPagination((prev) => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 1,
            }));

            // Process event distribution data
            if (data.eventCounts) {
                const distribution = [
                    { name: 'Opens', value: data.eventCounts.open || 0, color: '#10b981' },
                    { name: 'Clicks', value: data.eventCounts.click || 0, color: '#f59e0b' },
                    { name: 'Bounces', value: data.eventCounts.bounce || 0, color: '#ef4444' },
                    { name: 'Complaints', value: data.eventCounts.complaint || 0, color: '#8b5cf6' },
                ];
                setEventDistribution(distribution);
            }

            // Process geo stats
            if (data.geoStats) {
                setGeoStats(data.geoStats);
            }

            // Process device stats (example data - ideally should come from backend)
            const devices = processDeviceStats(data.events || []);
            setDeviceStats(devices);

            // Process time stats
            const timeData = processTimeStats(data.events || []);
            setTimeStats(timeData);

            // Process top locations
            if (data.geoStats && data.geoStats.countries) {
                setTopLocations(data.geoStats.countries.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching event logs:', error);
        } finally {
            setEventsLoading(false);
        }
    }, [id, templateId, pagination.page, pagination.limit, filters]);

    // Fetch transaction logs
    const fetchTransactionLogs = useCallback(async () => {
        try {
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}/logs`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                console.warn('Could not fetch transaction logs');
                return;
            }

            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Error fetching transaction logs:', error);
        }
    }, [id, templateId]);

    // Process device stats from user agents
    const processDeviceStats = (events) => {
        const deviceMap = {
            Mobile: 0,
            Desktop: 0,
            Tablet: 0,
            Other: 0,
        };

        events.forEach((event) => {
            if (event.metadata?.userAgent) {
                const ua = event.metadata.userAgent.toLowerCase();
                if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
                    deviceMap['Mobile']++;
                } else if (ua.includes('tablet') || ua.includes('ipad')) {
                    deviceMap['Tablet']++;
                } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox')) {
                    deviceMap['Desktop']++;
                } else {
                    deviceMap['Other']++;
                }
            } else {
                deviceMap['Other']++;
            }
        });

        // Convert to array format for chart
        return Object.keys(deviceMap).map((key) => ({
            name: key,
            value: deviceMap[key],
        }));
    };

    // Process time stats from events
    const processTimeStats = (events) => {
        const hours = Array(24)
            .fill(0)
            .map((_, i) => ({ hour: i, count: 0 }));

        events.forEach((event) => {
            if (event.timestamp) {
                const date = new Date(event.timestamp);
                const hour = date.getHours();
                hours[hour].count++;
            }
        });

        return hours;
    };

    // Handle template publishing
    const handlePublish = async () => {
        if (!template) return;

        try {
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}/publish`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to publish template');
            }

            fetchTemplateDetails();
        } catch (error) {
            console.error('Error publishing template:', error);
            setError(error.message);
        }
    };

    // Copy API key to clipboard
    const copyAPIKey = () => {
        if (!template || !template.apiKey) return;

        navigator.clipboard.writeText(template.apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Format date
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

    // Format date for chart
    const formatChartDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Reset to page 1 when changing filters
        setPagination((prev) => ({
            ...prev,
            page: 1,
        }));
    };

    // Handle date range change
    const handleDateRangeChange = (range) => {
        setDateRange(range);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setPagination((prev) => ({
            ...prev,
            page: newPage,
        }));
    };

    // Format event type for display
    const formatEventType = (type) => {
        switch (type) {
            case 'open':
                return {
                    label: 'Open',
                    icon: (
                        <Mail
                            size={14}
                            className="cd-event-icon cd-event-icon-open"
                        />
                    ),
                };
            case 'click':
                return {
                    label: 'Click',
                    icon: (
                        <MousePointer
                            size={14}
                            className="cd-event-icon cd-event-icon-click"
                        />
                    ),
                };
            case 'bounce':
                return {
                    label: 'Bounce',
                    icon: (
                        <X
                            size={14}
                            className="cd-event-icon cd-event-icon-bounce"
                        />
                    ),
                };
            case 'complaint':
                return {
                    label: 'Complaint',
                    icon: (
                        <AlertCircle
                            size={14}
                            className="cd-event-icon cd-event-icon-complaint"
                        />
                    ),
                };
            case 'delivery':
                return {
                    label: 'Delivery',
                    icon: (
                        <Mail
                            size={14}
                            className="cd-event-icon cd-event-icon-delivery"
                        />
                    ),
                };
            case 'unsubscribe':
                return {
                    label: 'Unsubscribe',
                    icon: (
                        <MailX
                            size={14}
                            className="cd-event-icon cd-event-icon-unsubscribe"
                        />
                    ),
                };
            default:
                return { label: type, icon: null };
        }
    };

    // Custom tooltip for daily chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-date">{label}</p>
                    {payload.map((entry, index) => (
                        <p
                            key={index}
                            style={{ color: entry.color }}
                        >
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Initialize data fetching
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && templateId) {
            fetchBrandDetails();
            fetchTemplateDetails();
        }
    }, [status, id, templateId, router, fetchBrandDetails, fetchTemplateDetails]);

    // Fetch additional data when template is loaded
    useEffect(() => {
        if (template && template.status === 'active') {
            fetchTemplateStats();
            fetchDailyStats();
        }
    }, [template, fetchTemplateStats, fetchDailyStats]);

    // Refetch daily stats when date range changes
    useEffect(() => {
        if (template && template.status === 'active') {
            fetchDailyStats();
        }
    }, [dateRange, fetchDailyStats, template]);

    // Fetch events when tab changes or filters updated
    useEffect(() => {
        if (template && activeTab === 'events') {
            fetchEventLogs();
        }
    }, [template, activeTab, pagination.page, filters, fetchEventLogs]);

    // Fetch logs when tab changes
    useEffect(() => {
        if (template && activeTab === 'logs') {
            fetchTransactionLogs();
        }
    }, [template, activeTab, fetchTransactionLogs]);

    // Show loading state
    if (isLoading || !brand || !template) {
        return (
            <BrandLayout brand={brand}>
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>Loading template details...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="template-detail-container">
                {/* Header */}
                <div className="cd-header">
                    <Link
                        href={`/brands/${id}/transactional`}
                        className="cd-back-link"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Transactional Templates</span>
                    </Link>

                    <div className="cd-campaign-header">
                        <h1>{template.name}</h1>
                        <div className="cd-campaign-meta">
                            <span className={`cd-status-badge cd-status-${template.status}`}>
                                {template.status === 'draft' ? (
                                    <>
                                        <Clock size={14} />
                                        <span>Draft</span>
                                    </>
                                ) : template.status === 'active' ? (
                                    <>
                                        <CheckCircle size={14} />
                                        <span>Published</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} />
                                        <span>Inactive</span>
                                    </>
                                )}
                            </span>
                            {template.status === 'active' && (
                                <div className="template-api-key">
                                    <span>API Key: </span>
                                    <code>{template.apiKey}</code>
                                    <button
                                        onClick={copyAPIKey}
                                        className="copy-btn"
                                        title="Copy API Key"
                                    >
                                        <Copy size={14} />
                                        {copied && <span className="copy-tooltip">Copied!</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="template-actions">
                    <Link
                        href={`/brands/${id}/transactional/${templateId}/edit`}
                        className="btn btn-secondary"
                    >
                        <Edit size={16} />
                        <span>Edit Template</span>
                    </Link>

                    {template.status === 'draft' && (
                        <button
                            onClick={handlePublish}
                            className="btn btn-primary"
                        >
                            <Play size={16} />
                            <span>Publish Template</span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowPreviewModal(true)}
                        className="btn btn-outline"
                    >
                        <Eye size={16} />
                        <span>Preview</span>
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="cd-section">
                    <div className="template-tabs">
                        <div className="tabs-navigation">
                            <button
                                className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <Mail size={16} />
                                <span>Overview</span>
                            </button>
                            <button
                                className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analytics')}
                            >
                                <BarChart2 size={16} />
                                <span>Analytics</span>
                            </button>
                            <button
                                className={`tab-item ${activeTab === 'events' ? 'active' : ''}`}
                                onClick={() => setActiveTab('events')}
                            >
                                <Clock size={16} />
                                <span>Events</span>
                            </button>
                            <button
                                className={`tab-item ${activeTab === 'api' ? 'active' : ''}`}
                                onClick={() => setActiveTab('api')}
                            >
                                <Code size={16} />
                                <span>API Documentation</span>
                            </button>
                            <button
                                className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`}
                                onClick={() => setActiveTab('logs')}
                            >
                                <Shield size={16} />
                                <span>Logs</span>
                            </button>
                        </div>

                        {/* Tab Contents */}
                        <div className="tab-content">
                            {activeTab === 'overview' && (
                                <div className="overview-tab">
                                    {/* Template Overview */}
                                    <div className="cd-summary-card">
                                        <div className="cd-card-header">
                                            <Mail size={18} />
                                            <h3>Template Details</h3>
                                        </div>
                                        <div className="cd-card-content">
                                            <div className="cd-summary-grid">
                                                <div className="cd-summary-item">
                                                    <span className="cd-summary-label">Subject</span>
                                                    <span className="cd-summary-value">{template.subject}</span>
                                                </div>

                                                <div className="cd-summary-item">
                                                    <span className="cd-summary-label">
                                                        <Calendar size={14} />
                                                        Created
                                                    </span>
                                                    <span className="cd-summary-value">{formatDate(template.createdAt)}</span>
                                                </div>

                                                <div className="cd-summary-item">
                                                    <span className="cd-summary-label">From</span>
                                                    <span className="cd-summary-value">
                                                        {template.fromName || brand.fromName} &lt;{template.fromEmail || brand.fromEmail}&gt;
                                                    </span>
                                                </div>

                                                <div className="cd-summary-item">
                                                    <span className="cd-summary-label">Reply To</span>
                                                    <span className="cd-summary-value">{template.replyTo || brand.replyToEmail || 'Not specified'}</span>
                                                </div>

                                                <div className="cd-summary-item">
                                                    <span className="cd-summary-label">Variables</span>
                                                    <div className="variables-list">
                                                        {template.variables && template.variables.length > 0 ? (
                                                            template.variables.map((variable, index) => (
                                                                <span
                                                                    key={index}
                                                                    className={`variable-tag ${variable.required ? 'required' : ''}`}
                                                                >
                                                                    {variable.name} {variable.required && <span className="required-badge">Required</span>}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted">No variables defined</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="cd-summary-item">
                                                    <button
                                                        className="cd-preview-btn"
                                                        onClick={() => setShowPreviewModal(true)}
                                                    >
                                                        <Eye size={14} />
                                                        <span>View Email Preview</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {template.status === 'active' && (
                                        <>
                                            {/* Daily Sending Chart */}
                                            <div className="cd-section">
                                                <div className="section-header with-actions">
                                                    <h2 className="cd-section-title">
                                                        <BarChart2 size={20} />
                                                        <span>Daily Email Activity</span>
                                                    </h2>
                                                    <div className="time-filter">
                                                        <button
                                                            className={`time-filter-btn ${dateRange === '7d' ? 'active' : ''}`}
                                                            onClick={() => handleDateRangeChange('7d')}
                                                        >
                                                            7 Days
                                                        </button>
                                                        <button
                                                            className={`time-filter-btn ${dateRange === '14d' ? 'active' : ''}`}
                                                            onClick={() => handleDateRangeChange('14d')}
                                                        >
                                                            14 Days
                                                        </button>
                                                        <button
                                                            className={`time-filter-btn ${dateRange === '30d' ? 'active' : ''}`}
                                                            onClick={() => handleDateRangeChange('30d')}
                                                        >
                                                            30 Days
                                                        </button>
                                                    </div>
                                                </div>

                                                {statsLoading ? (
                                                    <div className="cd-loading-inline">
                                                        <div className="cd-spinner-small"></div>
                                                        <p>Loading chart data...</p>
                                                    </div>
                                                ) : dailySendStats.length === 0 ? (
                                                    <div className="cd-empty-events">
                                                        <p>No data available for the chart. Try sending emails with this template first.</p>
                                                    </div>
                                                ) : (
                                                    <div className="chart-container">
                                                        <ResponsiveContainer
                                                            width="100%"
                                                            height={350}
                                                        >
                                                            <AreaChart
                                                                data={dailySendStats}
                                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                            >
                                                                <defs>
                                                                    <linearGradient
                                                                        id="sentColorGradient"
                                                                        x1="0"
                                                                        y1="0"
                                                                        x2="0"
                                                                        y2="1"
                                                                    >
                                                                        {BLUE_GRADIENT.map((item) => (
                                                                            <stop
                                                                                key={item.offset}
                                                                                offset={`${item.offset}%`}
                                                                                stopColor={item.color}
                                                                            />
                                                                        ))}
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid
                                                                    strokeDasharray="3 3"
                                                                    vertical={false}
                                                                    stroke="rgba(255, 255, 255, 0.1)"
                                                                />
                                                                <XAxis
                                                                    dataKey="displayDate"
                                                                    angle={0}
                                                                    textAnchor="middle"
                                                                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                                                                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                    tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                />
                                                                <YAxis
                                                                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                                                                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                    tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                />
                                                                <Tooltip content={<CustomTooltip />} />
                                                                <Legend />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="sent"
                                                                    name="Sent"
                                                                    fill="url(#sentColorGradient)"
                                                                    stroke="#5d87ff"
                                                                    activeDot={{ r: 6 }}
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="opens"
                                                                    name="Opens"
                                                                    stroke="#10b981"
                                                                    activeDot={{ r: 6 }}
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="clicks"
                                                                    name="Clicks"
                                                                    stroke="#f59e0b"
                                                                    activeDot={{ r: 6 }}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Performance Metrics */}
                                            <div className="cd-section">
                                                <h2 className="cd-section-title">
                                                    <BarChart2 size={20} />
                                                    <span>Template Performance</span>
                                                </h2>

                                                {statsLoading ? (
                                                    <div className="cd-loading-inline">
                                                        <div className="cd-spinner-small"></div>
                                                        <p>Loading statistics...</p>
                                                    </div>
                                                ) : (
                                                    <div className="cd-stats-cards">
                                                        <div className="cd-stat-card">
                                                            <div className="cd-stat-icon cd-stat-icon-delivered">
                                                                <Send size={18} />
                                                            </div>
                                                            <div className="cd-stat-content">
                                                                <div className="cd-stat-value">{stats?.sent?.toLocaleString() || 0}</div>
                                                                <div className="cd-stat-label">Total Sent</div>
                                                            </div>
                                                        </div>

                                                        <div className="cd-stat-card">
                                                            <div className="cd-stat-icon cd-stat-icon-opened">
                                                                <Mail size={18} />
                                                            </div>
                                                            <div className="cd-stat-content">
                                                                <div className="cd-stat-value">{stats?.opens?.toLocaleString() || 0}</div>
                                                                <div className="cd-stat-label">Opens</div>
                                                                <div className="cd-stat-percent">{stats?.openRate || 0}% open rate</div>
                                                            </div>
                                                        </div>

                                                        <div className="cd-stat-card">
                                                            <div className="cd-stat-icon cd-stat-icon-clicked">
                                                                <MousePointer size={18} />
                                                            </div>
                                                            <div className="cd-stat-content">
                                                                <div className="cd-stat-value">{stats?.clicks?.toLocaleString() || 0}</div>
                                                                <div className="cd-stat-label">Clicks</div>
                                                                <div className="cd-stat-percent">{stats?.clickRate || 0}% click rate</div>
                                                            </div>
                                                        </div>

                                                        <div className="cd-stat-card">
                                                            <div className="cd-stat-icon cd-stat-icon-bounced">
                                                                <AlertCircle size={18} />
                                                            </div>
                                                            <div className="cd-stat-content">
                                                                <div className="cd-stat-value">{stats?.bounces || 0}</div>
                                                                <div className="cd-stat-label">Bounces</div>
                                                                <div className="cd-stat-percent">{stats?.sent ? ((stats.bounces / stats.sent) * 100).toFixed(1) : 0}% bounce rate</div>
                                                            </div>
                                                        </div>

                                                        <div className="cd-stat-card">
                                                            <div
                                                                className="cd-stat-icon cd-stat-icon-bounced"
                                                                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}
                                                            >
                                                                <Users size={18} />
                                                            </div>
                                                            <div className="cd-stat-content">
                                                                <div className="cd-stat-value">{dailySendStats.reduce((total, day) => total + day.sent, 0)}</div>
                                                                <div className="cd-stat-label">Recent Period</div>
                                                                <div className="cd-stat-percent">Last {dateRange.replace('d', '')} days</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="analytics-tab">
                                    <div className="cd-section">
                                        <h2 className="cd-section-title">
                                            <BarChart2 size={20} />
                                            <span>Email Performance Analytics</span>
                                        </h2>

                                        {statsLoading ? (
                                            <div className="cd-loading-inline">
                                                <div className="cd-spinner-small"></div>
                                                <p>Loading analytics data...</p>
                                            </div>
                                        ) : dailyStats.length === 0 ? (
                                            <div className="cd-empty-events">
                                                <p>No data available for analytics. Try sending emails with this template first.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Email Activity Chart */}
                                                <div className="cd-section">
                                                    <div className="cd-card">
                                                        <div className="cd-card-header">
                                                            <h3>Daily Email Activity</h3>
                                                        </div>
                                                        <div className="cd-card-content">
                                                            <div style={{ width: '100%', height: 350 }}>
                                                                <ResponsiveContainer>
                                                                    <BarChart
                                                                        data={dailyStats.map((item) => ({
                                                                            ...item,
                                                                            formattedDate: formatChartDate(item.date),
                                                                        }))}
                                                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                                    >
                                                                        <CartesianGrid
                                                                            strokeDasharray="3 3"
                                                                            stroke="rgba(255, 255, 255, 0.1)"
                                                                        />
                                                                        <XAxis
                                                                            dataKey="formattedDate"
                                                                            angle={-45}
                                                                            textAnchor="end"
                                                                            height={70}
                                                                            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                                                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                            tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                        />
                                                                        <YAxis
                                                                            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                                                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                            tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                        />
                                                                        <Tooltip />
                                                                        <Legend />
                                                                        <Bar
                                                                            dataKey="sent"
                                                                            name="Sent"
                                                                            fill="#5d87ff"
                                                                        />
                                                                        <Bar
                                                                            dataKey="opens"
                                                                            name="Opened"
                                                                            fill="#10b981"
                                                                        />
                                                                        <Bar
                                                                            dataKey="clicks"
                                                                            name="Clicked"
                                                                            fill="#f59e0b"
                                                                        />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Event Distribution and Device Distribution */}
                                                <div className="analytics-grid">
                                                    {/* Event Distribution */}
                                                    <div className="cd-card">
                                                        <div className="cd-card-header">
                                                            <h3>Event Distribution</h3>
                                                        </div>
                                                        <div className="cd-card-content">
                                                            {eventDistribution.length > 0 ? (
                                                                <div className="pie-chart-container">
                                                                    <ResponsiveContainer
                                                                        width="100%"
                                                                        height={300}
                                                                    >
                                                                        <PieChart>
                                                                            <Pie
                                                                                data={eventDistribution}
                                                                                cx="50%"
                                                                                cy="50%"
                                                                                labelLine={true}
                                                                                outerRadius={100}
                                                                                fill="#8884d8"
                                                                                dataKey="value"
                                                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                                                                            >
                                                                                {eventDistribution.map((entry, index) => (
                                                                                    <Cell
                                                                                        key={`cell-${index}`}
                                                                                        fill={entry.color || COLORS[index % COLORS.length]}
                                                                                    />
                                                                                ))}
                                                                            </Pie>
                                                                            <Tooltip formatter={(value) => [value, 'Events']} />
                                                                        </PieChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            ) : (
                                                                <div className="cd-empty-events">
                                                                    <p>No event distribution data available.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Device Distribution */}
                                                    <div className="cd-card">
                                                        <div className="cd-card-header">
                                                            <h3>Device Usage</h3>
                                                        </div>
                                                        <div className="cd-card-content">
                                                            {deviceStats.length > 0 ? (
                                                                <div className="device-distribution">
                                                                    <div className="pie-chart-container">
                                                                        <ResponsiveContainer
                                                                            width="100%"
                                                                            height={220}
                                                                        >
                                                                            <PieChart>
                                                                                <Pie
                                                                                    data={deviceStats}
                                                                                    cx="50%"
                                                                                    cy="50%"
                                                                                    labelLine={false}
                                                                                    outerRadius={80}
                                                                                    fill="#8884d8"
                                                                                    dataKey="value"
                                                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                                                                                >
                                                                                    {deviceStats.map((entry, index) => (
                                                                                        <Cell
                                                                                            key={`cell-${index}`}
                                                                                            fill={COLORS[index % COLORS.length]}
                                                                                        />
                                                                                    ))}
                                                                                </Pie>
                                                                                <Tooltip formatter={(value) => [value, 'Opens']} />
                                                                            </PieChart>
                                                                        </ResponsiveContainer>
                                                                    </div>

                                                                    <div className="device-legend">
                                                                        {deviceStats.map((device, index) => (
                                                                            <div
                                                                                className="device-item"
                                                                                key={device.name}
                                                                            >
                                                                                <div className="device-icon">
                                                                                    {device.name === 'Mobile' && <Smartphone size={16} />}
                                                                                    {device.name === 'Desktop' && <Laptop size={16} />}
                                                                                    {device.name === 'Tablet' && <Tablet size={16} />}
                                                                                    {device.name === 'Other' && <Globe size={16} />}
                                                                                </div>
                                                                                <div className="device-name">{device.name}</div>
                                                                                <div className="device-value">{device.value}</div>
                                                                                <div className="device-percent">{((device.value / deviceStats.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="cd-empty-events">
                                                                    <p>No device data available.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Time Distribution and Geo Distribution */}
                                                <div className="analytics-grid">
                                                    {/* Time Distribution */}
                                                    <div className="cd-card">
                                                        <div className="cd-card-header">
                                                            <h3>Activity by Hour</h3>
                                                        </div>
                                                        <div className="cd-card-content">
                                                            {timeStats.length > 0 ? (
                                                                <div style={{ width: '100%', height: 250 }}>
                                                                    <ResponsiveContainer>
                                                                        <BarChart
                                                                            data={timeStats}
                                                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                                                        >
                                                                            <CartesianGrid
                                                                                strokeDasharray="3 3"
                                                                                stroke="rgba(255, 255, 255, 0.1)"
                                                                            />
                                                                            <XAxis
                                                                                dataKey="hour"
                                                                                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                                                                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                                tickFormatter={(hour) => {
                                                                                    let h = hour % 12;
                                                                                    if (h === 0) h = 12;
                                                                                    return `${h}${hour >= 12 ? 'pm' : 'am'}`;
                                                                                }}
                                                                            />
                                                                            <YAxis
                                                                                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                                                                                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                                tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                                                            />
                                                                            <Tooltip
                                                                                formatter={(value) => [value, 'Events']}
                                                                                labelFormatter={(hour) => {
                                                                                    let h = hour % 12;
                                                                                    if (h === 0) h = 12;
                                                                                    return `${h}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
                                                                                }}
                                                                            />
                                                                            <Bar
                                                                                dataKey="count"
                                                                                name="Activity"
                                                                                fill="#5d87ff"
                                                                            />
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            ) : (
                                                                <div className="cd-empty-events">
                                                                    <p>No time distribution data available.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Top Locations */}
                                                    <div className="cd-card">
                                                        <div className="cd-card-header">
                                                            <h3>Top Locations</h3>
                                                        </div>
                                                        <div className="cd-card-content">
                                                            {topLocations.length > 0 ? (
                                                                <div className="location-list">
                                                                    {topLocations.map((location, index) => (
                                                                        <div
                                                                            className="location-item"
                                                                            key={index}
                                                                        >
                                                                            <div className="location-rank">{index + 1}</div>
                                                                            <div className="location-name">
                                                                                <Globe size={16} />
                                                                                <span>{location.country || 'Unknown'}</span>
                                                                            </div>
                                                                            <div className="location-value">{location.count}</div>
                                                                            <div className="location-bar">
                                                                                <div
                                                                                    className="location-bar-fill"
                                                                                    style={{
                                                                                        width: `${(location.count / topLocations[0].count) * 100}%`,
                                                                                        backgroundColor: COLORS[index % COLORS.length],
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="cd-empty-events">
                                                                    <p>No location data available.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'events' && (
                                <div className="events-tab">
                                    <div className="cd-events-header">
                                        <h2 className="cd-section-title">
                                            <Clock size={20} />
                                            <span>Email Events</span>
                                        </h2>

                                        <div className="cd-events-actions">
                                            <button
                                                className="cd-btn cd-btn-outline"
                                                onClick={() => setShowFilters(!showFilters)}
                                            >
                                                <Filter size={14} />
                                                <span>Filter</span>
                                            </button>

                                            <button className="cd-btn cd-btn-outline">
                                                <Download size={14} />
                                                <span>Export</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    {showFilters && (
                                        <div className="cd-events-filters">
                                            <div className="cd-filter-group">
                                                <label>Event Type</label>
                                                <select
                                                    name="eventType"
                                                    value={filters.eventType}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="">All Events</option>
                                                    <option value="open">Opens</option>
                                                    <option value="click">Clicks</option>
                                                    <option value="bounce">Bounces</option>
                                                    <option value="complaint">Complaints</option>
                                                </select>
                                            </div>

                                            <div className="cd-filter-group">
                                                <label>Email Address</label>
                                                <input
                                                    type="text"
                                                    name="email"
                                                    value={filters.email}
                                                    onChange={handleFilterChange}
                                                    placeholder="Filter by email"
                                                />
                                            </div>

                                            <div className="cd-filter-group">
                                                <label>Sort By</label>
                                                <select
                                                    name="sort"
                                                    value={filters.sort}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="timestamp">Date/Time</option>
                                                    <option value="email">Email</option>
                                                    <option value="type">Event Type</option>
                                                </select>
                                            </div>

                                            <div className="cd-filter-group">
                                                <label>Order</label>
                                                <select
                                                    name="order"
                                                    value={filters.order}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="desc">Newest First</option>
                                                    <option value="asc">Oldest First</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Events Table */}
                                    {eventsLoading ? (
                                        <div className="cd-loading-inline">
                                            <div className="cd-spinner-small"></div>
                                            <p>Loading events...</p>
                                        </div>
                                    ) : events.length > 0 ? (
                                        <div className="cd-card cd-events-card">
                                            <div className="cd-events-table-container">
                                                <table className="cd-events-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Event</th>
                                                            <th>Email</th>
                                                            <th>Date/Time</th>
                                                            <th>Location</th>
                                                            <th>Details</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {events.map((event, index) => {
                                                            const eventInfo = formatEventType(event.type);
                                                            return (
                                                                <tr key={event._id || index}>
                                                                    <td className="cd-event-type">
                                                                        {eventInfo.icon}
                                                                        <span>{eventInfo.label}</span>
                                                                    </td>
                                                                    <td>{event.email}</td>
                                                                    <td>
                                                                        <span
                                                                            className="cd-event-time"
                                                                            title={formatDate(event.timestamp)}
                                                                        >
                                                                            {formatDistance(new Date(event.timestamp), new Date(), { addSuffix: true })}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {event.metadata?.geolocation ? (
                                                                            <span className="geo-location">
                                                                                {event.metadata.geolocation.city && event.metadata.geolocation.city !== 'Unknown' ? `${event.metadata.geolocation.city}, ` : ''}
                                                                                {event.metadata.geolocation.country || 'Unknown'}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted">Unknown</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {event.type === 'click' && event.metadata?.url && (
                                                                            <span
                                                                                className="cd-event-url"
                                                                                title={event.metadata.url}
                                                                            >
                                                                                {event.metadata.url}
                                                                            </span>
                                                                        )}
                                                                        {event.type === 'bounce' && (
                                                                            <span className="cd-event-reason">
                                                                                {event.metadata?.bounceType || 'Bounce'}
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
                                        </div>
                                    ) : (
                                        <div className="cd-empty-events">
                                            <p>No events have been recorded for this template yet.</p>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {events.length > 0 && pagination.totalPages > 1 && (
                                        <div className="cd-pagination">
                                            <button
                                                className="cd-pagination-btn"
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                disabled={pagination.page <= 1}
                                            >
                                                <ChevronLeft size={16} />
                                                <span>Previous</span>
                                            </button>

                                            <div className="cd-pagination-info">
                                                Page {pagination.page} of {pagination.totalPages}
                                            </div>

                                            <button
                                                className="cd-pagination-btn"
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                disabled={pagination.page >= pagination.totalPages}
                                            >
                                                <span>Next</span>
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'api' && (
                                <div className="api-tab">
                                    <APIDocsSection
                                        template={template}
                                        brand={brand}
                                    />
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="logs-tab">
                                    <div className="cd-events-header">
                                        <h2 className="cd-section-title">
                                            <Shield size={20} />
                                            <span>Transaction Logs</span>
                                        </h2>

                                        <div className="cd-info-tooltip">
                                            <Info size={16} />
                                            <span className="tooltip-text">These logs show the actual email sending transactions</span>
                                        </div>
                                    </div>

                                    {logs.length > 0 ? (
                                        <div className="cd-card">
                                            <div className="cd-events-table-container">
                                                <table className="cd-events-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Status</th>
                                                            <th>Recipient</th>
                                                            <th>Sent At</th>
                                                            <th>Events</th>
                                                            <th>IP Address</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {logs.map((log) => (
                                                            <tr key={log._id}>
                                                                <td>
                                                                    <span className={`cd-status-badge cd-status-${log.status}`}>
                                                                        {log.status === 'delivered' && <CheckCircle size={12} />}
                                                                        {log.status === 'sent' && <Clock size={12} />}
                                                                        {log.status === 'failed' && <AlertCircle size={12} />}
                                                                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                                    </span>
                                                                </td>
                                                                <td>{log.to}</td>
                                                                <td>{formatDate(log.sentAt)}</td>
                                                                <td>
                                                                    {log.events && log.events.length > 0 ? (
                                                                        <div className="event-indicators">
                                                                            {log.events.map((event, i) => {
                                                                                const eventInfo = formatEventType(event.type);
                                                                                return (
                                                                                    <span
                                                                                        key={i}
                                                                                        className="event-indicator-icon"
                                                                                        title={`${eventInfo.label} - ${formatDate(event.timestamp)}`}
                                                                                    >
                                                                                        {eventInfo.icon}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">No events</span>
                                                                    )}
                                                                </td>
                                                                <td className="ip-address">{log.metadata?.ipAddress || log.ipAddress || <span className="text-muted">N/A</span>}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="cd-empty-events">
                                            <p>No transaction logs available for this template.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreviewModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => setShowPreviewModal(false)}
                    >
                        <div
                            className="modal-container"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Email Preview</h2>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowPreviewModal(false)}
                                >
                                    <span>&times;</span>
                                </button>
                            </div>
                            <TemplatePreview template={template} />
                        </div>
                    </div>
                )}
            </div>

            {/* CSS Styles specific to this page */}
            <style jsx>{`
                /* Custom styles for the template detail page */
                .template-detail-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .cd-info-tooltip {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: help;
                }

                .cd-info-tooltip .tooltip-text {
                    visibility: hidden;
                    width: 250px;
                    background-color: #333;
                    color: #fff;
                    text-align: center;
                    border-radius: 6px;
                    padding: 8px;
                    position: absolute;
                    z-index: 1;
                    bottom: 125%;
                    left: 50%;
                    margin-left: -125px;
                    opacity: 0;
                    transition: opacity 0.3s;
                    font-size: 12px;
                    pointer-events: none;
                }

                .cd-info-tooltip:hover .tooltip-text {
                    visibility: visible;
                    opacity: 1;
                }

                .section-header.with-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .time-filter {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 6px;
                    padding: 4px;
                    border: 1px solid #2e2e2e;
                }

                .time-filter-btn {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    padding: 6px 12px;
                    font-size: 13px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .time-filter-btn:hover {
                    background-color: rgba(255, 255, 255, 0.05);
                    color: #ffffff;
                }

                .time-filter-btn.active {
                    background-color: #5d87ff;
                    color: white;
                }

                .chart-container {
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                }

                .custom-tooltip {
                    background-color: rgba(0, 0, 0, 0.8);
                    border: 1px solid #2e2e2e;
                    border-radius: 4px;
                    padding: 10px;
                }

                .tooltip-date {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: white;
                }

                .event-indicator-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background-color: rgba(0, 0, 0, 0.2);
                    margin-right: 5px;
                    cursor: help;
                }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .pie-chart-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .device-distribution {
                    display: flex;
                    flex-direction: column;
                }

                .device-legend {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 15px;
                }

                .device-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    border-radius: 4px;
                    background-color: rgba(0, 0, 0, 0.1);
                }

                .device-name {
                    flex: 1;
                    font-size: 14px;
                }

                .device-value {
                    font-weight: 600;
                    font-size: 14px;
                }

                .device-percent {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 12px;
                    min-width: 40px;
                    text-align: right;
                }

                .location-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .location-item {
                    display: grid;
                    grid-template-columns: 30px 1fr 50px;
                    gap: 10px;
                    align-items: center;
                    padding: 8px;
                    background-color: rgba(0, 0, 0, 0.1);
                    border-radius: 4px;
                }

                .location-rank {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    background-color: #5d87ff;
                    color: white;
                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: 600;
                }

                .location-name {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }

                .location-name svg {
                    color: #5d87ff;
                }

                .location-value {
                    font-weight: 600;
                    text-align: right;
                }

                .location-bar {
                    grid-column: 1 / -1;
                    height: 6px;
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .location-bar-fill {
                    height: 100%;
                    border-radius: 3px;
                }

                .geo-location {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 13px;
                }

                .text-muted {
                    color: rgba(255, 255, 255, 0.5);
                    font-style: italic;
                }

                .ip-address {
                    font-family: monospace;
                    font-size: 13px;
                }

                @media (max-width: 992px) {
                    .analytics-grid {
                        grid-template-columns: 1fr;
                    }

                    .device-legend {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .cd-summary-grid {
                        grid-template-columns: 1fr !important;
                    }

                    .cd-stats-cards {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }

                    .section-header.with-actions {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                }

                @media (max-width: 576px) {
                    .cd-stats-cards {
                        grid-template-columns: 1fr !important;
                    }

                    .template-actions {
                        flex-direction: column;
                    }

                    .template-actions > * {
                        width: 100%;
                    }
                }
            `}</style>
        </BrandLayout>
    );
}
