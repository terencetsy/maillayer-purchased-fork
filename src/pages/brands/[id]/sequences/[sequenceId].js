// src/pages/brands/[id]/sequences/[sequenceId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Users, Mail, Clock, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import { getEmailSequence, getSequenceEnrollments, updateEmailSequence } from '@/services/clientEmailSequenceService';

export default function ViewEmailSequence() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, sequenceId } = router.query;

    const [brand, setBrand] = useState(null);
    const [sequence, setSequence] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && sequenceId) {
            fetchBrandDetails();
            fetchSequence();
            fetchEnrollments();
        }
    }, [status, id, sequenceId, router]);

    useEffect(() => {
        if (id && sequenceId) {
            fetchEnrollments();
        }
    }, [currentPage, statusFilter]);

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

    const fetchSequence = async () => {
        try {
            setIsLoading(true);
            const data = await getEmailSequence(id, sequenceId);
            setSequence(data);
        } catch (error) {
            console.error('Error fetching sequence:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEnrollments = async () => {
        try {
            const data = await getSequenceEnrollments(id, sequenceId, {
                page: currentPage,
                limit: 20,
                status: statusFilter,
            });
            setEnrollments(data.enrollments);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            setError(error.message);
        }
    };

    const handleToggleStatus = async () => {
        try {
            const newStatus = sequence.status === 'active' ? 'paused' : 'active';
            await updateEmailSequence(id, sequenceId, { status: newStatus });
            setSuccess(`Sequence ${newStatus === 'active' ? 'activated' : 'paused'}`);
            fetchSequence();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error updating sequence:', error);
            setError(error.message);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: { bg: '#e8f5e9', color: '#2e7d32' },
            completed: { bg: '#e3f2fd', color: '#1976d2' },
            paused: { bg: '#fff3e0', color: '#f57c00' },
            unsubscribed: { bg: '#ffebee', color: '#dc2626' },
            bounced: { bg: '#ffebee', color: '#dc2626' },
        };

        const style = styles[status] || styles.active;

        return (
            <span
                style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: style.bg,
                    color: style.color,
                }}
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (isLoading || !sequence) {
        return (
            <BrandLayout brand={brand}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', gap: '1rem' }}>
                    <div style={{ width: '2rem', height: '2rem', border: '3px solid #f0f0f0', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: '#666' }}>Loading sequence...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="campaigns-container">
                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <Link
                        href={`/brands/${id}/sequences`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#666',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                        }}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Sequences</span>
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '500', color: '#1a1a1a' }}>{sequence.name}</h1>
                            {sequence.description && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', color: '#666' }}>{sequence.description}</p>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {getStatusBadge(sequence.status)}
                                <span style={{ fontSize: '0.8125rem', color: '#999' }}>
                                    • {sequence.emails?.length || 0} emails • Created {formatDate(sequence.createdAt)}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleToggleStatus}
                                className="button button--secondary"
                            >
                                {sequence.status === 'active' ? 'Pause' : 'Activate'}
                            </button>
                            <Link
                                href={`/brands/${id}/sequences/${sequenceId}/edit`}
                                className="button button--primary"
                            >
                                Edit Sequence
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div
                        className="alert alert--error"
                        style={{ marginBottom: '1rem' }}
                    >
                        <span>{error}</span>
                        <button
                            onClick={() => setError('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {success && (
                    <div
                        className="alert alert--success"
                        style={{ marginBottom: '1rem' }}
                    >
                        <span>{success}</span>
                        <button
                            onClick={() => setSuccess('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '8px', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2' }}>
                                <Users size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Enrolled</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>{sequence.stats?.totalEnrolled || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '8px', background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f57c00' }}>
                                <Activity size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>{sequence.stats?.totalActive || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '8px', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d32' }}>
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>{sequence.stats?.totalCompleted || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '8px', background: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7b1fa2' }}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Rate</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>{sequence.stats?.totalEnrolled > 0 ? Math.round((sequence.stats.totalCompleted / sequence.stats.totalEnrolled) * 100) : 0}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Steps */}
                <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '500' }}>Email Sequence</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {sequence.emails?.map((email, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '6px',
                                    background: '#fafafa',
                                }}
                            >
                                <div
                                    style={{
                                        width: '2rem',
                                        height: '2rem',
                                        borderRadius: '50%',
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '600',
                                        fontSize: '0.875rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    {email.order}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{email.subject}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#666' }}>
                                        <Clock size={12} />
                                        <span>
                                            Send after {email.delayAmount} {email.delayUnit}
                                            {index > 0 && ' from previous email'}
                                        </span>
                                    </div>
                                </div>
                                <Mail
                                    size={18}
                                    style={{ color: '#666', flexShrink: 0 }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Enrollments */}
                <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '500' }}>Enrolled Contacts</h2>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="paused">Paused</option>
                            <option value="unsubscribed">Unsubscribed</option>
                        </select>
                    </div>

                    {enrollments.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                            <p style={{ margin: 0 }}>No enrolled contacts yet</p>
                        </div>
                    ) : (
                        <>
                            <table className="campaigns-table">
                                <thead>
                                    <tr>
                                        <th>Contact</th>
                                        <th>Current Step</th>
                                        <th>Emails Sent</th>
                                        <th>Status</th>
                                        <th>Enrolled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map((enrollment) => (
                                        <tr key={enrollment._id}>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{enrollment.contactId?.email || 'Unknown'}</div>
                                                    {enrollment.contactId?.firstName && (
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                                            {enrollment.contactId.firstName} {enrollment.contactId.lastName || ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                Step {enrollment.currentStep} of {sequence.emails?.length || 0}
                                            </td>
                                            <td>{enrollment.emailsSent?.length || 0}</td>
                                            <td>{getStatusBadge(enrollment.status)}</td>
                                            <td>{formatDate(enrollment.enrolledAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
                                    <button
                                        className="button button--secondary button--small"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        className="button button--secondary button--small"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </BrandLayout>
    );
}
