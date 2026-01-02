import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Search, PlusCircle, Upload, Trash, DownloadCloud, ChevronDown, X, Users, RefreshCw, Check, UserCheck, UserX, AlertOctagon } from 'lucide-react';
import ImportContactsModal from '@/components/contact/ImportContactsModal';
import DailyContactsChart from '@/components/contact/DailyContactsChart';
import ContactListApiSettings from '@/components/contact/ContactListApiSettings';
import { Code } from 'lucide-react';

export default function ContactListDetails() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, listId } = router.query;

    const [brand, setBrand] = useState(null);
    const [contactList, setContactList] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isUpdatingContact, setIsUpdatingContact] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [sortField, setSortField] = useState('email');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showDropdown, setShowDropdown] = useState(false);
    const [contactStatusCounts, setContactStatusCounts] = useState({
        active: 0,
        unsubscribed: 0,
        bounced: 0,
        complained: 0,
    });
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importMethod, setImportMethod] = useState(null);
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusUpdateReason, setStatusUpdateReason] = useState('');

    const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'api'

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && listId) {
            fetchBrandDetails();
            fetchContactList();
        }
    }, [status, id, listId, router]);

    useEffect(() => {
        if (contactList) {
            fetchContacts();
        }
    }, [contactList, currentPage, sortField, sortOrder, searchQuery, statusFilter]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (showDropdown) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

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

    const fetchContactList = async () => {
        try {
            setIsLoadingList(true);
            const res = await fetch(`/api/brands/${id}/contact-lists/${listId}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Contact list not found');
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch contact list');
                }
            }

            const data = await res.json();
            setContactList(data);
        } catch (error) {
            console.error('Error fetching contact list:', error);
            setError(error.message);
        } finally {
            setIsLoadingList(false);
        }
    };

    const fetchContacts = async () => {
        try {
            setIsLoading(true);
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: 20,
                sort: sortField,
                order: sortOrder,
                search: searchQuery,
                status: statusFilter !== 'all' ? statusFilter : '',
            });

            const res = await fetch(`/api/brands/${id}/contact-lists/${listId}/contacts?${queryParams}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch contacts');
            }

            const data = await res.json();
            setContacts(data.contacts);
            setTotalPages(data.totalPages);
            setContactStatusCounts(
                data.statusCounts || {
                    active: 0,
                    unsubscribed: 0,
                    bounced: 0,
                    complained: 0,
                }
            );
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportContacts = (method) => {
        setImportMethod(method);
        setShowImportModal(true);
        setShowDropdown(false);
    };

    const handleImportSuccess = () => {
        fetchContactList();
        fetchContacts();
        setShowImportModal(false);
        setSuccess('Contacts imported successfully!');

        setTimeout(() => {
            setSuccess('');
        }, 3000);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleContactSelect = (contactId) => {
        if (selectedContacts.includes(contactId)) {
            setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
        } else {
            setSelectedContacts([...selectedContacts, contactId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedContacts.length === contacts.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(contacts.map((contact) => contact._id));
        }
    };

    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
    };

    const handleDeleteSelected = async () => {
        if (selectedContacts.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedContacts.length} selected contacts?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/brands/${id}/contact-lists/${listId}/contacts`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contactIds: selectedContacts,
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to delete contacts');
            }

            setSelectedContacts([]);
            setSuccess(`Successfully deleted ${selectedContacts.length} contacts`);
            fetchContactList();
            fetchContacts();

            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (error) {
            console.error('Error deleting contacts:', error);
            setError(error.message);
        }
    };

    const handleExportContacts = async () => {
        try {
            const res = await fetch(`/api/brands/${id}/contact-lists/${listId}/export?status=${statusFilter !== 'all' ? statusFilter : ''}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to export contacts');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${contactList.name}-contacts.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Error exporting contacts:', error);
            setError(error.message);
        }
    };

    const handleUpdateContactStatus = async (contactId, newStatus, reason = '') => {
        try {
            setIsUpdatingContact(true);

            const res = await fetch(`/api/brands/${id}/contact-lists/${listId}/contacts/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contactId,
                    status: newStatus,
                    reason,
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update contact status');
            }

            setSuccess(`Contact status updated to ${newStatus}`);
            fetchContacts();

            if (showStatusUpdateModal) {
                setShowStatusUpdateModal(false);
                setSelectedStatus('');
                setStatusUpdateReason('');
            }

            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (error) {
            console.error('Error updating contact status:', error);
            setError(error.message);
        } finally {
            setIsUpdatingContact(false);
        }
    };

    const handleBulkStatusUpdate = async () => {
        if (selectedContacts.length === 0) {
            setError('No contacts selected');
            return;
        }

        if (!selectedStatus) {
            setError('Please select a status');
            return;
        }

        try {
            setIsUpdatingContact(true);

            const res = await fetch(`/api/brands/${id}/contact-lists/${listId}/contacts/bulk-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contactIds: selectedContacts,
                    status: selectedStatus,
                    reason: statusUpdateReason,
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update contacts');
            }

            const data = await res.json();
            setSuccess(`Updated ${data.updated} contacts to ${selectedStatus}`);
            setSelectedContacts([]);
            fetchContacts();

            setShowStatusUpdateModal(false);
            setSelectedStatus('');
            setStatusUpdateReason('');

            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (error) {
            console.error('Error updating contacts:', error);
            setError(error.message);
        } finally {
            setIsUpdatingContact(false);
        }
    };

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setShowDropdown(!showDropdown);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setCurrentPage(1);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'active':
                return 'cld-status-badge cld-status-badge--active';
            case 'unsubscribed':
                return 'cld-status-badge cld-status-badge--unsubscribed';
            case 'bounced':
                return 'cld-status-badge cld-status-badge--bounced';
            case 'complained':
                return 'cld-status-badge cld-status-badge--complained';
            default:
                return 'cld-status-badge';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <UserCheck size={14} />;
            case 'unsubscribed':
                return <UserX size={14} />;
            case 'bounced':
                return <AlertOctagon size={14} />;
            case 'complained':
                return <AlertOctagon size={14} />;
            default:
                return null;
        }
    };

    if (!brand || isLoadingList) {
        return (
            <BrandLayout brand={brand}>
                <div className="cld-loading">
                    <div className="spinner"></div>
                    <p>Loading contact list...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="campaigns-container">
                {/* Header */}
                <div className="cld-header">
                    <Link href={`/brands/${id}/contacts`} className="cld-back-link">
                        <ArrowLeft size={16} />
                        <span>Back to Contact Lists</span>
                    </Link>
                    <div>
                        <h1 className="cld-title">{contactList.name}</h1>
                        {contactList.description && <p className="cld-description">{contactList.description}</p>}
                        <div className="cld-meta">
                            <span>{contactList.contactCount || 0} contacts total</span>
                            <span>•</span>
                            <span>Created {new Date(contactList.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="cld-alert cld-alert--error">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="cld-alert-close">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="cld-alert cld-alert--success">
                        <span>{success}</span>
                        <button onClick={() => setSuccess('')} className="cld-alert-close">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Status Summary */}
                <div className="cld-status-filters">
                    <button
                        onClick={() => handleStatusFilterChange('all')}
                        className={`cld-status-card cld-status-card--all ${statusFilter === 'all' ? 'active' : ''}`}
                    >
                        <span className="cld-status-count">{contactList.contactCount || 0}</span>
                        <span className="cld-status-label">All</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilterChange('active')}
                        className={`cld-status-card cld-status-card--active ${statusFilter === 'active' ? 'active' : ''}`}
                    >
                        <span className="cld-status-count">{contactStatusCounts.active || 0}</span>
                        <span className="cld-status-label">Active</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilterChange('unsubscribed')}
                        className={`cld-status-card cld-status-card--unsubscribed ${statusFilter === 'unsubscribed' ? 'active' : ''}`}
                    >
                        <span className="cld-status-count">{contactStatusCounts.unsubscribed || 0}</span>
                        <span className="cld-status-label">Unsubscribed</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilterChange('bounced')}
                        className={`cld-status-card cld-status-card--bounced ${statusFilter === 'bounced' ? 'active' : ''}`}
                    >
                        <span className="cld-status-count">{contactStatusCounts.bounced || 0}</span>
                        <span className="cld-status-label">Bounced</span>
                    </button>
                    <button
                        onClick={() => handleStatusFilterChange('complained')}
                        className={`cld-status-card cld-status-card--complained ${statusFilter === 'complained' ? 'active' : ''}`}
                    >
                        <span className="cld-status-count">{contactStatusCounts.complained || 0}</span>
                        <span className="cld-status-label">Complained</span>
                    </button>
                </div>

                {/* Chart */}
                {!isLoading && contactList && (
                    <DailyContactsChart
                        brandId={id}
                        listId={listId}
                        status={statusFilter}
                    />
                )}

                {/* Actions Bar */}
                <div className="campaigns-header" style={{ marginTop: '1.5rem' }}>
                    <div className="search-container" style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="search-input-wrapper" style={{ position: 'relative' }}>
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button onClick={clearSearch} className="cld-search-clear">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            className="button button--secondary button--small"
                            onClick={() => fetchContacts()}
                            title="Refresh contacts"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div className="cld-dropdown">
                            <button className="button button--secondary" onClick={toggleDropdown}>
                                <Upload size={16} />
                                <span>Import</span>
                                <ChevronDown size={16} />
                            </button>
                            {showDropdown && (
                                <div className="cld-dropdown-menu">
                                    <button className="cld-dropdown-item" onClick={() => handleImportContacts('manual')}>
                                        <PlusCircle size={16} />
                                        <span>Add Manually</span>
                                    </button>
                                    <button className="cld-dropdown-item" onClick={() => handleImportContacts('csv')}>
                                        <Upload size={16} />
                                        <span>Import CSV</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            className="button button--secondary"
                            onClick={handleExportContacts}
                            disabled={contactList.contactCount === 0}
                        >
                            <DownloadCloud size={16} />
                            <span>Export</span>
                        </button>

                        {selectedContacts.length > 0 && (
                            <>
                                <button className="button button--secondary" onClick={() => setShowStatusUpdateModal(true)}>
                                    <UserCheck size={16} />
                                    <span>Update Status</span>
                                </button>
                                <button className="button button--secondary button--danger" onClick={handleDeleteSelected}>
                                    <Trash size={16} />
                                    <span>Delete ({selectedContacts.length})</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="cld-tabs">
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`cld-tab ${activeTab === 'contacts' ? 'active' : ''}`}
                    >
                        <Users size={16} />
                        Contacts
                    </button>
                    <button
                        onClick={() => setActiveTab('api')}
                        className={`cld-tab ${activeTab === 'api' ? 'active' : ''}`}
                    >
                        <Code size={16} />
                        API Access
                    </button>
                </div>

                {/* Contacts Table */}
                {activeTab === 'contacts' && (
                    <div>
                        {isLoading ? (
                            <div className="cld-loading">
                                <div className="spinner"></div>
                                <p>Loading contacts...</p>
                            </div>
                        ) : (
                            <>
                                {contacts.length === 0 ? (
                                    <div className="cld-empty">
                                        <div className="cld-empty-icon">
                                            <Users size={32} />
                                        </div>
                                        <h3 className="cld-empty-title">No contacts found</h3>
                                        <p className="cld-empty-desc">
                                            {searchQuery || statusFilter !== 'all'
                                                ? 'No contacts match your search criteria. Try a different search term or clear your filters.'
                                                : "This list doesn't have any contacts yet. Import contacts to get started."}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            {searchQuery || statusFilter !== 'all' ? (
                                                <button
                                                    className="button button--secondary"
                                                    onClick={() => {
                                                        clearSearch();
                                                        setStatusFilter('all');
                                                    }}
                                                >
                                                    Clear Filters
                                                </button>
                                            ) : (
                                                <button className="button button--primary" onClick={() => handleImportContacts('csv')}>
                                                    <Upload size={16} />
                                                    Import Contacts
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="contacts-details-table-wrapper">
                                            <table className="campaigns-table">
                                                <thead>
                                                <tr>
                                                    <th>
                                                        <input
                                                            type="checkbox"
                                                            className="table-checkbox"
                                                            checked={selectedContacts.length === contacts.length && contacts.length > 0}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </th>
                                                    <th
                                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                                        onClick={() => handleSort('email')}
                                                    >
                                                        Email {sortField === 'email' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                                    </th>
                                                    <th
                                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                                        onClick={() => handleSort('firstName')}
                                                    >
                                                        First Name {sortField === 'firstName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                                    </th>
                                                    <th
                                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                                        onClick={() => handleSort('lastName')}
                                                    >
                                                        Last Name {sortField === 'lastName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                                    </th>
                                                    <th
                                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                                        onClick={() => handleSort('status')}
                                                    >
                                                        Status {sortField === 'status' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                                    </th>
                                                    <th>Phone</th>
                                                    <th
                                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                                        onClick={() => handleSort('createdAt')}
                                                    >
                                                        Added {sortField === 'createdAt' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                                    </th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contacts.map((contact) => (
                                                    <tr key={contact._id}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                className="table-checkbox"
                                                                checked={selectedContacts.includes(contact._id)}
                                                                onChange={() => handleContactSelect(contact._id)}
                                                            />
                                                        </td>
                                                        <td>{contact.email}</td>
                                                        <td>{contact.firstName || '-'}</td>
                                                        <td>{contact.lastName || '-'}</td>
                                                        <td>
                                                            <span className={getStatusBadgeClass(contact.status || 'active')}>
                                                                {getStatusIcon(contact.status || 'active')}
                                                                <span>{contact.status || 'active'}</span>
                                                            </span>
                                                        </td>
                                                        <td>{contact.phone || '-'}</td>
                                                        <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                                                        <td className="actions-col">
                                                            <div className="cld-action-buttons">
                                                                {contact.status !== 'active' && (
                                                                    <button
                                                                        className="cld-action-btn cld-action-btn--activate"
                                                                        onClick={() => handleUpdateContactStatus(contact._id, 'active')}
                                                                        title="Set as Active"
                                                                    >
                                                                        <UserCheck size={14} />
                                                                    </button>
                                                                )}
                                                                {contact.status !== 'unsubscribed' && (
                                                                    <button
                                                                        className="cld-action-btn cld-action-btn--unsubscribe"
                                                                        onClick={() => handleUpdateContactStatus(contact._id, 'unsubscribed')}
                                                                        title="Unsubscribe"
                                                                    >
                                                                        <UserX size={14} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="cld-action-btn cld-action-btn--delete"
                                                                    onClick={() => {
                                                                        if (window.confirm('Are you sure you want to delete this contact?')) {
                                                                            setSelectedContacts([contact._id]);
                                                                            handleDeleteSelected();
                                                                        }
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <Trash size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                    </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="cld-pagination">
                                                <button
                                                    className="button button--secondary button--small"
                                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </button>
                                                <span className="cld-pagination-info">
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
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'api' && (
                    <ContactListApiSettings
                        brandId={id}
                        listId={listId}
                    />
                )}
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <ImportContactsModal
                    brandId={id}
                    listId={listId}
                    method={importMethod}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                />
            )}

            {/* Status Update Modal */}
            {showStatusUpdateModal && (
                <div className="form-modal-overlay">
                    <div className="form-modal">
                        <div className="modal-form-container">
                            <div className="modal-form-header">
                                <h2>Update Contact Status</h2>
                                <button
                                    className="modal-form-close"
                                    onClick={() => setShowStatusUpdateModal(false)}
                                    type="button"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p
                                className="form-help"
                                style={{ marginBottom: '1rem' }}
                            >
                                Update the status for {selectedContacts.length} selected contacts.
                            </p>

                            <div className="form">
                                <div className="form-group">
                                    <label className="form-label">
                                        New Status<span className="form-required">*</span>
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        required
                                        className="form-select"
                                    >
                                        <option value="">Select a status</option>
                                        <option value="active">Active</option>
                                        <option value="unsubscribed">Unsubscribed</option>
                                        <option value="bounced">Bounced</option>
                                        <option value="complained">Complained</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Reason (optional)</label>
                                    <textarea
                                        value={statusUpdateReason}
                                        onChange={(e) => setStatusUpdateReason(e.target.value)}
                                        placeholder="Enter a reason for this status change..."
                                        rows={3}
                                        className="form-textarea"
                                    ></textarea>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="button button--secondary"
                                        onClick={() => setShowStatusUpdateModal(false)}
                                        disabled={isUpdatingContact}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="button button--primary"
                                        onClick={handleBulkStatusUpdate}
                                        disabled={!selectedStatus || isUpdatingContact}
                                    >
                                        {isUpdatingContact ? (
                                            <>
                                                <span className="spinner-icon">⟳</span>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} />
                                                Update Contacts
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </BrandLayout>
    );
}
