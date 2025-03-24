import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MailSend02 } from '@/lib/icons';

export default function BrandDetail() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [brand, setBrand] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id) {
            fetchBrandDetails();
        }
    }, [status, id, router]);

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
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/brands/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete brand');
            }

            router.push('/brands');
        } catch (error) {
            console.error('Error deleting brand:', error);
            setError(error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#51cf66';
            case 'inactive':
                return '#adb5bd';
            case 'pending_setup':
                return '#74c0fc';
            case 'pending_verification':
                return '#ffd43b';
            default:
                return '#adb5bd';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'inactive':
                return 'Inactive';
            case 'pending_setup':
                return 'Needs Setup';
            case 'pending_verification':
                return 'Pending Verification';
            default:
                return status;
        }
    };

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading brand details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard">
                <header className="dashboard-header">
                    <div className="dashboard-logo">
                        <MailSend02 />
                        <span>Maillayer</span>
                    </div>
                </header>

                <main className="dashboard-main">
                    <div className="empty-state">
                        <h2>Error</h2>
                        <p>{error}</p>
                        <Link
                            href="/brands"
                            className="btn btn-primary"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    if (!brand) return null;

    return (
        <>
            <Head>
                <title>{brand.name} | Maillayer</title>
                <meta
                    name="description"
                    content={`${brand.name} - Maillayer Brand Details`}
                />
            </Head>

            <div className="dashboard">
                <header className="dashboard-header">
                    <div className="dashboard-logo">
                        <MailSend02 />
                        <span>Maillayer</span>
                    </div>
                </header>

                <main className="dashboard-main">
                    <div className="brand-header-nav">
                        <Link
                            href="/brands"
                            className="back-link"
                        >
                            &larr; Back to Dashboard
                        </Link>
                    </div>

                    <div className="brand-detail-header">
                        <div>
                            <h1>{brand.name}</h1>
                            <div className="brand-status">
                                <span
                                    className="status-dot"
                                    style={{ backgroundColor: getStatusColor(brand.status) }}
                                ></span>
                                <span>{getStatusText(brand.status)}</span>
                            </div>
                        </div>

                        <div className="brand-actions">
                            <button className="btn btn-secondary">Edit</button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="brand-detail-container">
                        <div className="brand-detail-section">
                            <h2>Brand Details</h2>

                            <div className="detail-grid">
                                <div className="detail-item">
                                    <h3>Brand Name</h3>
                                    <p>{brand.name}</p>
                                </div>

                                <div className="detail-item">
                                    <h3>Website</h3>
                                    <p>{brand.website}</p>
                                </div>

                                <div className="detail-item">
                                    <h3>Created</h3>
                                    <p>{new Date(brand.createdAt).toLocaleDateString()}</p>
                                </div>

                                <div className="detail-item">
                                    <h3>Last Updated</h3>
                                    <p>{new Date(brand.updatedAt).toLocaleDateString()}</p>
                                </div>

                                {brand.status === 'pending_setup' && (
                                    <div className="detail-item setup-notice">
                                        <h3>Email Setup</h3>
                                        <p>You need to configure AWS SES for this brand to send emails.</p>
                                        <button className="btn btn-sm btn-primary mt-sm">Configure Email</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="brand-detail-section">
                            <h2>Email Campaigns</h2>
                            <div className="empty-campaigns">
                                <p>No email campaigns have been created for this brand yet.</p>
                                <button className="btn btn-primary">Create Campaign</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
