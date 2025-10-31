// src/pages/brands/[id]/sequences/[sequenceId]/logs.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft02, Filter, Mail02, AlertCircle, ChevronDown, MouseLeftClick04 } from '@/lib/icons';
import { formatDistance } from 'date-fns';

export default function SequenceLogs() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, sequenceId } = router.query;

    const [brand, setBrand] = useState(null);
    const [sequence, setSequence] = useState(null);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [statusCounts, setStatusCounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        email: '',
        status: '',
        startDate: '',
        endDate: '',
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && sequenceId) {
            fetchBrandDetails();
            fetchSequenceDetails();
            fetchStats();
        }
    }, [status, id, sequenceId, router]);

    useEffect(() => {
        if (id && sequenceId) {
            fetchLogs();
        }
    }, [pagination.page, filters]);

    const fetchBrandDetails = async () => {
        try {
            const res = await fetch(`/api/brands/${id}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch brand details');
            }

            const data = await res.json();
            setBrand(data);
        } catch (error) {
            console.error('Error fetching brand details:', error);
            setError(error.message);
        }
    };

    const fetchSequenceDetails = async () => {
        try {
            const res = await fetch(`/api/brands/${id}/email-sequences/${sequenceId}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch sequence details');
            }

            const data = await res.json();
            setSequence(data);
        } catch (error) {
            console.error('Error fetching sequence details:', error);
            setError(error.message);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/brands/${id}/email-sequences/${sequenceId}/stats`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                console.warn('Could not fetch stats');
                return;
            }

            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchLogs = async () => {
        try {
            setIsLoading(true);

            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
            });

            const res = await fetch(`/api/brands/${id}/email-sequences/${sequenceId}/logs?${queryParams}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch logs');
            }

            const data = await res.json();
            setLogs(data.logs || []);
            setStatusCounts(data.statusCounts || {});
            setPagination((prev) => ({
                ...prev,
                total: data.pagination.total,
                totalPages: data.pagination.totalPages,
            }));
        } catch (error) {
            console.error('Error fetching logs:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
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
        switch (type) {
            case 'open':
                return {
                    label: 'Open',
                    icon: <Mail02 size={14} />,
                };
            case 'click':
                return {
                    label: 'Click',
                    icon: <MouseLeftClick04 size={14} />,
                };
            case 'bounce':
                return {
                    label: 'Bounce',
                    icon: <AlertCircle size={14} />,
                };
            case 'complaint':
                return {
                    label: 'Complaint',
                    icon: <AlertCircle size={14} />,
                };
            default:
                return { label: type, icon: null };
        }
    };

    if (isLoading && !sequence) {
        return (
            <BrandLayout brand={brand}>
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>Loading logs...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="template-detail-container">
                {/* Header */}
                <div className="detail-header">
                    <Link
                        href={`/brands/${id}/sequences/${sequenceId}`}
                        className="back-link"
                    >
                        <ArrowLeft02 size={16} />
                        <span>Back to Sequence</span>
                    </Link>

                    <div className="template-header">
                        <div className="template-header-content">
                            <h1>{sequence?.name} - Email Logs</h1>
                            <div className="template-meta">
                                <div className="subject-line">
                                    <span className="subject-label">Sequence:</span>
                                    <span className="subject-value">{sequence?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div className="detail-section stats-summary-section">
                        <div className="section-header">
                            <h2>Email Performance</h2>
                        </div>

                        <div className="stats-cards">
                            <div className="stat-card">
                                <div className="stat-icon stat-icon-sent">
                                    <Mail02 size={18} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{stats.sent?.toLocaleString() || 0}</div>
                                    <div className="stat-label">Total Sent</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon stat-icon-opened">
                                    <Mail02 size={18} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{stats.opens?.toLocaleString() || 0}</div>
                                    <div className="stat-label">Opens</div>
                                    <div className="stat-percent">{stats.openRate || 0}% open rate</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon stat-icon-clicked">
                                    <MouseLeftClick04 size={18} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{stats.clicks?.toLocaleString() || 0}</div>
                                    <div className="stat-label">Clicks</div>
                                    <div className="stat-percent">{stats.clickRate || 0}% click rate</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon stat-icon-bounced">
                                    <AlertCircle size={18} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{stats.bounces || 0}</div>
                                    <div className="stat-label">Bounces</div>
                                    <div className="stat-percent">{stats.bounceRate || 0}% bounce rate</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="detail-section transaction-logs-section">
                    <div className="section-header logs-header">
                        <h2>Email Activity Logs</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="button button--secondary button--small"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={14} />
                                <span>Filter</span>
                                <ChevronDown
                                    size={14}
                                    style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                />
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div style={{ padding: '1rem', background: '#fafafa', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#666', marginBottom: '0.5rem' }}>Email Address</label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={filters.email}
                                        onChange={handleFilterChange}
                                        placeholder="Filter by email"
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#666', marginBottom: '0.5rem' }}>Status</label>
                                    <select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="form-select"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="sent">Sent</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#666', marginBottom: '0.5rem' }}>Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#666', marginBottom: '0.5rem' }}>End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logs Table */}
                    {isLoading ? (
                        <div className="loading-inline">
                            <div className="spinner-small"></div>
                            <p>Loading logs...</p>
                        </div>
                    ) : logs.length > 0 ? (
                        <>
                            <div className="logs-table-container">
                                <table className="logs-table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Email</th>
                                            <th>Step</th>
                                            <th>Subject</th>
                                            <th>Sent At</th>
                                            <th>Events</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log._id}>
                                                <td>
                                                    <span className={`status-badge status-${log.status}`}>{log.status}</span>
                                                </td>
                                                <td>{log.email}</td>
                                                <td>Email {log.emailOrder}</td>
                                                <td>{log.subject}</td>
                                                <td>
                                                    <span title={formatDate(log.sentAt)}>{formatDistance(new Date(log.sentAt), new Date(), { addSuffix: true })}</span>
                                                </td>
                                                <td>
                                                    {log.events && log.events.length > 0 ? (
                                                        <div className="event-indicators">
                                                            {log.events.map((event, i) => {
                                                                const eventInfo = formatEventType(event.type);
                                                                return (
                                                                    <span
                                                                        key={i}
                                                                        title={`${eventInfo.label} - ${formatDate(event.timestamp)}`}
                                                                        className="event-indicator"
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
                                    <button
                                        className="button button--secondary button--small"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        className="button button--secondary button--small"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>No logs available for this sequence.</p>
                        </div>
                    )}
                </div>
            </div>
        </BrandLayout>
    );
}
