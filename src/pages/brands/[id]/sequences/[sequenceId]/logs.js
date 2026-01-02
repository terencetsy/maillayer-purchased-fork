// src/pages/brands/[id]/sequences/[sequenceId]/logs.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Filter, Mail, AlertCircle, ChevronDown, MousePointerClick, Send, Eye, MousePointer } from 'lucide-react';
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
                    icon: <Eye size={12} />,
                };
            case 'click':
                return {
                    label: 'Click',
                    icon: <MousePointer size={12} />,
                };
            case 'bounce':
                return {
                    label: 'Bounce',
                    icon: <AlertCircle size={12} />,
                };
            case 'complaint':
                return {
                    label: 'Complaint',
                    icon: <AlertCircle size={12} />,
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
            <div className="logs-page-container">
                {/* Header */}
                <div className="logs-page-header">
                    <Link href={`/brands/${id}/sequences`} className="back-link">
                        <ArrowLeft size={14} />
                        <span>Back to Sequences</span>
                    </Link>
                    <h1 className="logs-page-title">{sequence?.name} - Logs</h1>
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div className="logs-stats-grid">
                        <div className="logs-stat-card">
                            <div className="logs-stat-icon logs-stat-icon--sent">
                                <Send size={16} />
                            </div>
                            <div className="logs-stat-content">
                                <span className="logs-stat-value">{stats.sent?.toLocaleString() || 0}</span>
                                <span className="logs-stat-label">Sent</span>
                            </div>
                        </div>

                        <div className="logs-stat-card">
                            <div className="logs-stat-icon logs-stat-icon--opened">
                                <Eye size={16} />
                            </div>
                            <div className="logs-stat-content">
                                <span className="logs-stat-value">{stats.opens?.toLocaleString() || 0}</span>
                                <span className="logs-stat-label">Opens ({stats.openRate || 0}%)</span>
                            </div>
                        </div>

                        <div className="logs-stat-card">
                            <div className="logs-stat-icon logs-stat-icon--clicked">
                                <MousePointerClick size={16} />
                            </div>
                            <div className="logs-stat-content">
                                <span className="logs-stat-value">{stats.clicks?.toLocaleString() || 0}</span>
                                <span className="logs-stat-label">Clicks ({stats.clickRate || 0}%)</span>
                            </div>
                        </div>

                        <div className="logs-stat-card">
                            <div className="logs-stat-icon logs-stat-icon--bounced">
                                <AlertCircle size={16} />
                            </div>
                            <div className="logs-stat-content">
                                <span className="logs-stat-value">{stats.bounces || 0}</span>
                                <span className="logs-stat-label">Bounces ({stats.bounceRate || 0}%)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Logs */}
                <div className="logs-section">
                    <div className="logs-section-header">
                        <h2>Activity Logs</h2>
                        <button
                            className="button button--secondary button--small"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={14} />
                            Filter
                            <ChevronDown size={14} className={`filter-chevron ${showFilters ? 'open' : ''}`} />
                        </button>
                    </div>

                    {showFilters && (
                        <div className="logs-filters">
                            <div className="logs-filters-grid">
                                <div className="filter-field">
                                    <label className="filter-label">Email</label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={filters.email}
                                        onChange={handleFilterChange}
                                        placeholder="Filter by email"
                                        className="form-input"
                                    />
                                </div>

                                <div className="filter-field">
                                    <label className="filter-label">Status</label>
                                    <select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="form-select"
                                    >
                                        <option value="">All</option>
                                        <option value="sent">Sent</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                <div className="filter-field">
                                    <label className="filter-label">From</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="form-input"
                                    />
                                </div>

                                <div className="filter-field">
                                    <label className="filter-label">To</label>
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
                            <div className="spinner"></div>
                            <span>Loading logs...</span>
                        </div>
                    ) : logs.length > 0 ? (
                        <>
                            <div className="logs-table-wrapper">
                                <table className="campaigns-table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Email</th>
                                            <th>Step</th>
                                            <th>Subject</th>
                                            <th>Sent</th>
                                            <th>Events</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log._id}>
                                                <td>
                                                    <span className={`status-badge ${log.status}`}>{log.status}</span>
                                                </td>
                                                <td className="log-email">{log.email}</td>
                                                <td className="log-step">Step {log.emailOrder}</td>
                                                <td className="log-subject">{log.subject}</td>
                                                <td className="log-date" title={formatDate(log.sentAt)}>
                                                    {formatDistance(new Date(log.sentAt), new Date(), { addSuffix: true })}
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
                                                                        className={`event-indicator event-indicator--${event.type}`}
                                                                    >
                                                                        {eventInfo.icon}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="logs-pagination">
                                    <button
                                        className="button button--secondary button--small"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="pagination-text">
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
                        <div className="empty-state compact">
                            <p>No logs available for this sequence.</p>
                        </div>
                    )}
                </div>
            </div>
        </BrandLayout>
    );
}
