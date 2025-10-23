import React from 'react';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { ArrowBounce28Filled, Copy01, Delete02, Edit01, Eye, Mail02, PieChart, UserMinus01 } from '@/lib/icons';

const CampaignList = ({ campaigns, brandId }) => {
    const handleDuplicate = async (campaignId, campaignName) => {
        // Implementation for duplicating campaign
        // You'll need to create an API endpoint for this
        try {
            const response = await fetch(`/api/brands/${brandId}/campaigns/${campaignId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: `${campaignName} (Copy)` }),
            });

            if (response.ok) {
                // Refresh the page or update the list
                window.location.reload();
            } else {
                alert('Failed to duplicate campaign');
            }
        } catch (error) {
            console.error('Error duplicating campaign:', error);
            alert('An error occurred while duplicating the campaign');
        }
    };

    // Function to handle campaign deletion
    const handleDelete = async (campaignId) => {
        if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/brands/${brandId}/campaigns/${campaignId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    // Refresh the page or update the list
                    window.location.reload();
                } else {
                    alert('Failed to delete campaign');
                }
            } catch (error) {
                console.error('Error deleting campaign:', error);
                alert('An error occurred while deleting the campaign');
            }
        }
    };

    // Function to render the status badge
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'draft':
                return <span className="status-badge draft">Draft</span>;
            case 'scheduled':
                return <span className="status-badge scheduled">Scheduled</span>;
            case 'sending':
                return <span className="status-badge sending">Sending</span>;
            case 'sent':
                return <span className="status-badge sent">Sent</span>;
            case 'queued':
                return <span className="status-badge queued">Queued</span>;
            case 'failed':
                return <span className="status-badge failed">Failed</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    // Format the date nicely
    const formatDate = (dateString) => {
        if (!dateString) return 'Not sent';
        const date = new Date(dateString);
        return formatDistance(date, new Date(), { addSuffix: true });
    };

    return (
        <div className="campaigns-table-container">
            <table className="campaigns-table">
                <thead>
                    <tr>
                        <th className="campaign-col">Campaign</th>
                        <th className="status-col">Status</th>
                        <th className="recipients-col">Recipients</th>
                        <th className="openrate-col">Open Rate</th>
                        <th className="unsub-col">Unsubscribed</th>
                        <th className="bounce-col">Bounced</th>
                        <th className="created-col">Created</th>
                        <th className="actions-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((campaign) => (
                        <tr key={campaign._id}>
                            <td className="campaign-col">
                                <div className="campaign-info">
                                    <div className="email-icon">
                                        <Mail02 />
                                    </div>
                                    <div className="campaign-details">
                                        <div className="campaign-subject">{campaign.subject}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="status-col">{renderStatusBadge(campaign.status)}</td>
                            <td className="recipients-col">{campaign.stats?.recipients || campaign.statistics?.recipients || 0}</td>
                            <td className="openrate-col">
                                <div className="stats-value">
                                    <PieChart
                                        size={14}
                                        className="stats-icon"
                                    />
                                    {campaign.statistics?.openRate || campaign.openRate || '0'}%
                                </div>
                            </td>
                            <td className="unsub-col">
                                <div className="stats-value">
                                    <UserMinus01
                                        size={14}
                                        className="stats-icon"
                                    />
                                    {campaign.statistics?.unsubscribedCount || campaign.stats?.unsubscribes || campaign.statistics?.unsubscribed?.total || 0}
                                </div>
                            </td>
                            <td className="bounce-col">
                                <div className="stats-value">
                                    <ArrowBounce28Filled
                                        size={14}
                                        className="stats-icon"
                                    />
                                    {campaign.statistics?.bouncedCount || 0}
                                </div>
                            </td>
                            <td className="created-col">{formatDate(campaign.createdAt)}</td>
                            <td className="actions-col">
                                <div className="action-buttons">
                                    <Link
                                        href={`/brands/${brandId}/campaigns/${campaign._id}`}
                                        className="action-btn view-btn"
                                        title="View Campaign"
                                    >
                                        <Eye size={16} />
                                    </Link>
                                    {campaign.status === 'draft' && (
                                        <Link
                                            href={`/brands/${brandId}/campaigns/${campaign._id}/editor`}
                                            className="action-btn edit-btn"
                                            title="Edit Campaign"
                                        >
                                            <Edit01 size={16} />
                                        </Link>
                                    )}
                                    <div
                                        className="action-btn duplicate-btn"
                                        onClick={() => handleDuplicate(campaign._id, campaign.name)}
                                    >
                                        <Copy01 size={16} />
                                    </div>
                                    {campaign.status === 'draft' && (
                                        <button
                                            className="action-btn delete-btn"
                                            title="Delete Campaign"
                                            onClick={() => handleDelete(campaign._id)}
                                        >
                                            <Delete02 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CampaignList;
