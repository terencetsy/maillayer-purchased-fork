// src/pages/brands/[id]/campaigns/index.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import BrandLayout from '@/components/BrandLayout';
import CampaignForm from '@/components/CampaignForm';
import CampaignList from '@/components/CampaignList';
import { Mail02, PlusSign, PlusSignCircle, Search01, ChevronLeft, ChevronRight } from '@/lib/icons';

export default function BrandCampaigns() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [brand, setBrand] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 8,
        total: 0,
        totalPages: 0,
        hasMore: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id) {
            fetchBrandDetails();
        }
    }, [status, id, router]);

    useEffect(() => {
        if (brand) {
            fetchCampaigns();
        }
    }, [brand, pagination.page, pagination.limit]);

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

    const fetchCampaigns = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/campaigns?page=${pagination.page}&limit=${pagination.limit}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch campaigns');
            }

            const data = await res.json();
            setCampaigns(data.campaigns);
            setPagination((prev) => ({
                ...prev,
                total: data.pagination.total,
                totalPages: data.pagination.totalPages,
                hasMore: data.pagination.hasMore,
            }));
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClick = () => {
        setShowCreateForm(true);
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
    };

    const handleCreateSuccess = (newCampaign) => {
        // Refresh the campaign list
        fetchCampaigns();
        setShowCreateForm(false);
    };

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({
            ...prev,
            page: newPage,
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLimitChange = (newLimit) => {
        setPagination((prev) => ({
            ...prev,
            limit: newLimit,
            page: 1, // Reset to first page when changing limit
        }));
    };

    // Filter campaigns based on search query
    const filteredCampaigns = campaigns.filter((campaign) => {
        return campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) || campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (isLoading && !brand) return null;

    return (
        <BrandLayout brand={brand}>
            <div className="campaigns-container">
                {/* Search and Create Bar */}
                <div className="campaigns-header">
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <Search01
                                size={18}
                                className="search-icon"
                            />
                            <input
                                type="text"
                                placeholder="Search campaigns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                    <button
                        className="button button--primary"
                        onClick={handleCreateClick}
                    >
                        <PlusSign size={18} />
                        Create Campaign
                    </button>
                </div>

                {/* Campaign Form */}
                {showCreateForm && (
                    <div className="form-modal-overlay">
                        <div className="form-modal">
                            <CampaignForm
                                brand={brand}
                                onCancel={handleCancelCreate}
                                onSuccess={handleCreateSuccess}
                            />
                        </div>
                    </div>
                )}

                {/* Campaigns List or Empty State */}
                <>
                    {isLoading ? (
                        <div className="loading-section">
                            <div className="spinner"></div>
                            <p>Loading campaigns...</p>
                        </div>
                    ) : (
                        <>
                            {campaigns.length === 0 && pagination.page === 1 ? (
                                <div className="empty-state">
                                    <div className="icon-wrapper">
                                        <Mail02 size={36} />
                                    </div>
                                    <h2>No campaigns yet</h2>
                                    <p>Create your first email campaign to start engaging with your audience</p>
                                    <button
                                        className="button button--secondary"
                                        onClick={handleCreateClick}
                                    >
                                        <PlusSignCircle size={18} />
                                        Create Campaign
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {filteredCampaigns.length === 0 ? (
                                        <div className="empty-state search-empty">
                                            <h2>No matching campaigns</h2>
                                            <p>No campaigns match your search criteria</p>
                                            <button
                                                className="button button--secondary"
                                                onClick={() => setSearchQuery('')}
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <CampaignList
                                                campaigns={filteredCampaigns}
                                                brandId={id}
                                            />

                                            {/* Pagination Controls */}
                                            {pagination.totalPages > 1 && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginTop: '2rem',
                                                        padding: '1rem',
                                                        background: '#fff',
                                                        border: '1px solid #f0f0f0',
                                                        borderRadius: '0.5rem',
                                                        flexWrap: 'wrap',
                                                        gap: '1rem',
                                                    }}
                                                >
                                                    {/* Items per page selector */}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        <span style={{ color: '#666' }}>Show:</span>
                                                        <select
                                                            value={pagination.limit}
                                                            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                                                            style={{
                                                                padding: '0.375rem 0.75rem',
                                                                border: '1px solid #e5e5e5',
                                                                borderRadius: '0.375rem',
                                                                fontSize: '0.875rem',
                                                                cursor: 'pointer',
                                                                background: '#fff',
                                                            }}
                                                        >
                                                            <option value={8}>8</option>
                                                            <option value={15}>15</option>
                                                            <option value={30}>30</option>
                                                        </select>
                                                        <span style={{ color: '#666' }}>per page</span>
                                                    </div>

                                                    {/* Page navigation */}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '1rem',
                                                        }}
                                                    >
                                                        <button
                                                            className="button button--secondary button--small"
                                                            onClick={() => handlePageChange(pagination.page - 1)}
                                                            disabled={pagination.page <= 1}
                                                            style={{
                                                                opacity: pagination.page <= 1 ? 0.5 : 1,
                                                                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                                                            }}
                                                        >
                                                            <ChevronLeft size={16} />
                                                            <span>Previous</span>
                                                        </button>

                                                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                                            Page {pagination.page} of {pagination.totalPages}
                                                        </span>

                                                        <button
                                                            className="button button--secondary button--small"
                                                            onClick={() => handlePageChange(pagination.page + 1)}
                                                            disabled={!pagination.hasMore}
                                                            style={{
                                                                opacity: !pagination.hasMore ? 0.5 : 1,
                                                                cursor: !pagination.hasMore ? 'not-allowed' : 'pointer',
                                                            }}
                                                        >
                                                            <span>Next</span>
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Total count */}
                                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                        {pagination.total} total campaign{pagination.total !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </>
            </div>
        </BrandLayout>
    );
}
