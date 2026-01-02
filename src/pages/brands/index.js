import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Plus, LogOut, Mail } from 'lucide-react';
import BrandForm from '@/components/BrandForm';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState(null);
    const [brands, setBrands] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user) {
            setUserProfile({
                name: session.user.name || '',
                email: session.user.email || '',
                role: session.user.role || 'user',
            });

            fetchUserProfile();
            fetchBrands();
        }
    }, [status, session, router]);

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/user/profile', { credentials: 'same-origin' });
            if (!res.ok) return;
            const data = await res.json();
            setUserProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchBrands = async () => {
        try {
            const res = await fetch('/api/brands', { credentials: 'same-origin' });
            if (!res.ok) return;
            const data = await res.json();
            setBrands(data);

            if (data.length === 0) {
                setShowCreateForm(true);
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' });
    };

    const handleCreateClick = () => {
        setShowCreateForm(true);
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
    };

    const handleCreateSuccess = (newBrand) => {
        setBrands((prevBrands) => [...prevBrands, newBrand]);
        setShowCreateForm(false);
    };

    const getStatusConfig = (status) => {
        const configs = {
            active: { label: 'Active', class: 'status-active' },
            inactive: { label: 'Inactive', class: 'status-inactive' },
            pending_setup: { label: 'Setup Required', class: 'status-warning' },
            pending_verification: { label: 'Pending', class: 'status-pending' },
        };
        return configs[status] || { label: status, class: 'status-inactive' };
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!session) return null;

    return (
        <>
            <Head>
                <title>Brands - Maillayer</title>
                <meta
                    name="description"
                    content="Manage your brands"
                />
                <link
                    rel="icon"
                    href="/favicon.png"
                />
            </Head>

            <div className="brands-page">
                {/* Header */}
                <header className="page-header">
                    <div className="header-content">
                        <Link
                            href="/brands"
                            className="brand-logo"
                        >
                            <img src="https://c1.tablecdn.com/maillayer/logo.png" alt="Maillayer" height={24} />
                        </Link>

                        <div className="header-right">
                            <div className="user-section">
                                <div className="user-avatar">{userProfile?.name?.charAt(0) || 'U'}</div>
                                <span className="user-name">{userProfile?.name || 'User'}</span>
                            </div>
                            <button
                                className="btn-icon"
                                onClick={handleSignOut}
                                title="Sign out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="page-main">
                    <div className="page-container">
                        {/* Title Bar */}
                        <div className="title-bar">
                            <h1>Brands</h1>
                            {!showCreateForm && brands.length > 0 && (
                                <button
                                    className="button button--primary"
                                    onClick={handleCreateClick}
                                >
                                    <Plus size={16} />
                                    <span>New Brand</span>
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        {showCreateForm ? (
                            <div className="form-card">
                                <BrandForm
                                    onCancel={handleCancelCreate}
                                    onSuccess={handleCreateSuccess}
                                />
                            </div>
                        ) : (
                            <>
                                {brands.length === 0 ? (
                                    <div className="empty-view">
                                        <div className="empty-icon">
                                            <Mail size={40} />
                                        </div>
                                        <h2>No brands yet</h2>
                                        <p>Create your first brand to start sending campaigns</p>
                                        <button
                                            className="button button--primary"
                                            onClick={handleCreateClick}
                                        >
                                            <Plus size={16} />
                                            <span>Create Brand</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table className="brands-table">
                                            <thead>
                                                <tr>
                                                    <th>Brand</th>
                                                    <th>Website</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {brands.map((brand) => {
                                                    const statusConfig = getStatusConfig(brand.status);
                                                    return (
                                                        <tr
                                                            key={brand._id}
                                                            onClick={() => router.push(`/brands/${brand._id}`)}
                                                        >
                                                            <td>
                                                                <div className="brand-cell">
                                                                    <img
                                                                        src={`https://www.google.com/s2/favicons?sz=64&domain_url=${brand.website}`}
                                                                        alt={brand.name}
                                                                        className="brand-favicon"
                                                                        onError={(e) => {
                                                                            e.target.src =
                                                                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" fill="%23e5e5e5" rx="4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="14" font-weight="600"%3E' +
                                                                                brand.name.charAt(0).toUpperCase() +
                                                                                '%3C/text%3E%3C/svg%3E';
                                                                        }}
                                                                    />
                                                                    <span className="brand-name">{brand.name}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="brand-website">{brand.website}</span>
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${statusConfig.class}`}>{statusConfig.label}</span>
                                                            </td>
                                                            <td>
                                                                <span className="brand-date">
                                                                    {new Date(brand.createdAt).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                    })}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
