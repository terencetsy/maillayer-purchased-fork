import { useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function CampaignList({ campaigns, brandId }) {
    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date
            .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
            .replace(/\//g, '/');
    };

    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft':
                return (
                    <span className="status-badge draft">
                        <Clock size={14} /> Draft
                    </span>
                );
            case 'scheduled':
                return <span className="status-badge scheduled">Scheduled</span>;
            case 'sent':
                return <span className="status-badge sent">Sent</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    return (
        <div className="campaigns-table-container">
            <table className="campaigns-table">
                <thead>
                    <tr>
                        <th className="campaign-col">CAMPAIGN</th>
                        <th className="status-col">STATUS</th>
                        <th className="recipients-col">RECIPIENTS</th>
                        <th className="openrate-col">OPEN RATE</th>
                        <th className="created-col">
                            CREATED
                            <button className="sort-btn">↓</button>
                        </th>
                        <th className="actions-col">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((campaign) => (
                        <tr key={campaign._id}>
                            <td className="campaign-col">
                                <div className="campaign-info">
                                    <div className="email-icon">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                width="20"
                                                height="16"
                                                x="2"
                                                y="4"
                                                rx="2"
                                            />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </div>
                                    <div className="campaign-details">
                                        <div className="campaign-name">{campaign.name}</div>
                                        <div className="campaign-subject">{campaign.subject}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="status-col">{getStatusBadge(campaign.status)}</td>
                            <td className="recipients-col">{campaign.stats?.recipients || 0}</td>
                            <td className="openrate-col">{campaign.status === 'sent' ? `${campaign.openRate}%` : '-'}</td>
                            <td className="created-col">{formatDate(campaign.createdAt)}</td>
                            <td className="actions-col">
                                <div className="action-buttons">
                                    <Link
                                        href={`/brands/${brandId}/campaigns/${campaign._id}`}
                                        className="view-btn"
                                    >
                                        View
                                    </Link>
                                    {campaign.status === 'draft' && (
                                        <Link
                                            href={`/brands/${brandId}/campaigns/${campaign._id}/edit`}
                                            className="edit-btn"
                                        >
                                            Edit
                                        </Link>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
