// src/pages/brands/[id]/contacts/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import BrandLayout from '@/components/BrandLayout';
import { PlusCircle, Search, Users, Trash, UploadCloud, UserPlus, Filter, Tag, Edit2, X, ChevronDown, Check } from 'lucide-react';
import CreateContactListModal from '@/components/contact/CreateContactListModal';
import ImportContactsModal from '@/components/contact/ImportContactsModal';
import { Eye, PlusSign } from '@/lib/icons';
import Link from 'next/link';

export default function BrandContacts() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, tab: queryTab } = router.query;

    const [activeTab, setActiveTab] = useState('lists'); // 'lists' or 'segments'
    const [brand, setBrand] = useState(null);
    const [contactLists, setContactLists] = useState([]);
    const [segments, setSegments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSegments, setIsLoadingSegments] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals state
    const [showCreateListModal, setShowCreateListModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSegmentModal, setShowSegmentModal] = useState(false);
    const [editingSegment, setEditingSegment] = useState(null);
    const [importMethod, setImportMethod] = useState(null);
    const [selectedListId, setSelectedListId] = useState(null);

    // Available tags for segment rules
    const [availableTags, setAvailableTags] = useState([]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id) {
            fetchBrandDetails();
            fetchContactLists();
            fetchSegments();
            fetchTags();
        }
    }, [status, id, router]);

    useEffect(() => {
        if (queryTab === 'segments') {
            setActiveTab('segments');
        }
    }, [queryTab]);

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

    const fetchContactLists = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/contact-lists`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch contact lists');
            }

            const data = await res.json();
            setContactLists(data);
        } catch (error) {
            console.error('Error fetching contact lists:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSegments = async () => {
        try {
            setIsLoadingSegments(true);
            const res = await fetch(`/api/brands/${id}/segments?refreshCounts=true`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setSegments([]);
                    return;
                }
                throw new Error('Failed to fetch segments');
            }

            const data = await res.json();
            setSegments(data);
        } catch (error) {
            console.error('Error fetching segments:', error);
            setSegments([]);
        } finally {
            setIsLoadingSegments(false);
        }
    };

    const fetchTags = async () => {
        try {
            const res = await fetch(`/api/brands/${id}/contacts/tags`, {
                credentials: 'same-origin',
            });

            if (res.ok) {
                const data = await res.json();
                setAvailableTags(data.tags || []);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const handleCreateList = () => {
        setShowCreateListModal(true);
    };

    const handleCreateListSuccess = (newList) => {
        setContactLists([newList, ...contactLists]);
        setShowCreateListModal(false);
    };

    const handleDeleteList = async (e, listId) => {
        e.preventDefault();
        e.stopPropagation();

        const list = contactLists.find((l) => l._id === listId);
        if (!list) return;

        if (window.confirm(`Are you sure you want to delete the "${list.name}" contact list?`)) {
            try {
                const res = await fetch(`/api/brands/${id}/contact-lists/${listId}`, {
                    method: 'DELETE',
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    throw new Error('Failed to delete contact list');
                }

                setContactLists(contactLists.filter((list) => list._id !== listId));
            } catch (error) {
                console.error('Error deleting contact list:', error);
                setError(error.message);
            }
        }
    };

    const handleImportContacts = (e, listId, method) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedListId(listId);
        setImportMethod(method);
        setShowImportModal(true);
    };

    const handleImportSuccess = () => {
        fetchContactLists();
        setShowImportModal(false);
    };

    const handleCreateSegment = () => {
        setEditingSegment(null);
        setShowSegmentModal(true);
    };

    const handleEditSegment = (segment) => {
        setEditingSegment(segment);
        setShowSegmentModal(true);
    };

    const handleDeleteSegment = async (segmentId) => {
        if (!window.confirm('Are you sure you want to delete this segment?')) {
            return;
        }

        try {
            const res = await fetch(`/api/brands/${id}/segments/${segmentId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to delete segment');
            }

            setSegments(segments.filter((s) => s._id !== segmentId));
            setSuccess('Segment deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error deleting segment:', error);
            setError(error.message);
        }
    };

    const handleSegmentSaved = (savedSegment) => {
        if (editingSegment) {
            setSegments(segments.map((s) => (s._id === savedSegment._id ? savedSegment : s)));
        } else {
            setSegments([savedSegment, ...segments]);
        }
        setShowSegmentModal(false);
        setSuccess(editingSegment ? 'Segment updated successfully' : 'Segment created successfully');
        setTimeout(() => setSuccess(''), 3000);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Filter contact lists based on search query
    const filteredContactLists = contactLists.filter((list) => {
        const searchLower = searchQuery.toLowerCase();
        return list.name.toLowerCase().includes(searchLower) || (list.description && list.description.toLowerCase().includes(searchLower));
    });

    // Filter segments based on search query
    const filteredSegments = segments.filter((segment) => {
        const searchLower = searchQuery.toLowerCase();
        return segment.name.toLowerCase().includes(searchLower) || (segment.description && segment.description.toLowerCase().includes(searchLower));
    });

    const getSegmentTypeBadge = (type) => {
        if (type === 'static') {
            return (
                <span
                    style={{
                        fontSize: '0.6875rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                    }}
                >
                    Static
                </span>
            );
        }
        return (
            <span
                style={{
                    fontSize: '0.6875rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#f3e5f5',
                    color: '#7b1fa2',
                }}
            >
                Dynamic
            </span>
        );
    };

    const getContactListNames = (contactListIds) => {
        if (!contactListIds || contactListIds.length === 0) {
            return (
                <span
                    style={{
                        fontSize: '0.8125rem',
                        color: '#999',
                        fontStyle: 'italic',
                    }}
                >
                    All lists
                </span>
            );
        }

        const listNames = contactListIds
            .map((listId) => {
                const list = contactLists.find((l) => l._id === listId);
                return list ? list.name : null;
            })
            .filter(Boolean);

        if (listNames.length === 0) {
            return <span style={{ fontSize: '0.8125rem', color: '#999', fontStyle: 'italic' }}>All lists</span>;
        }

        // Show first 2 lists with pill style, then +X more if needed
        const displayLimit = 2;
        const displayedLists = listNames.slice(0, displayLimit);
        const remainingCount = listNames.length - displayLimit;

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                {displayedLists.map((name, index) => (
                    <span
                        key={index}
                        style={{
                            fontSize: '0.6875rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f0f0f0',
                            color: '#333',
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                        }}
                        title={name}
                    >
                        {name}
                    </span>
                ))}
                {remainingCount > 0 && (
                    <span
                        style={{
                            fontSize: '0.6875rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#e8e8e8',
                            color: '#666',
                        }}
                        title={listNames.slice(displayLimit).join(', ')}
                    >
                        +{remainingCount} more
                    </span>
                )}
            </div>
        );
    };

    const getRuleDescription = (segment) => {
        if (!segment.conditions?.rules?.length) {
            return 'No conditions set';
        }

        const ruleCount = segment.conditions.rules.length;
        const matchType = segment.conditions.matchType === 'any' ? 'any' : 'all';

        return `${ruleCount} rule${ruleCount !== 1 ? 's' : ''} (match ${matchType})`;
    };

    if (isLoading && !brand) return null;

    return (
        <BrandLayout brand={brand}>
            <div className="campaigns-container">
                {/* Tab Navigation */}
                <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0' }}>
                        <button
                            onClick={() => setActiveTab('lists')}
                            style={{
                                padding: '0.875rem 1.25rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'lists' ? '2px solid #1a1a1a' : '2px solid transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === 'lists' ? '500' : '400',
                                color: activeTab === 'lists' ? '#1a1a1a' : '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9375rem',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Users size={18} />
                            Contact Lists
                            {contactLists.length > 0 && (
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        backgroundColor: activeTab === 'lists' ? '#1a1a1a' : '#e5e5e5',
                                        color: activeTab === 'lists' ? '#fff' : '#666',
                                    }}
                                >
                                    {contactLists.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('segments')}
                            style={{
                                padding: '0.875rem 1.25rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'segments' ? '2px solid #1a1a1a' : '2px solid transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === 'segments' ? '500' : '400',
                                color: activeTab === 'segments' ? '#1a1a1a' : '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9375rem',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Filter size={18} />
                            Segments
                            {segments.length > 0 && (
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        backgroundColor: activeTab === 'segments' ? '#1a1a1a' : '#e5e5e5',
                                        color: activeTab === 'segments' ? '#fff' : '#666',
                                    }}
                                >
                                    {segments.length}
                                </span>
                            )}
                        </button>
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
                            <X size={16} />
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
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Contact Lists Tab */}
                {activeTab === 'lists' && (
                    <>
                        {/* Search and Create Bar */}
                        <div className="campaigns-header">
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <Search
                                        size={18}
                                        className="search-icon"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search contact lists..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>
                            <button
                                className="button button--primary"
                                onClick={handleCreateList}
                            >
                                <PlusSign size={18} />
                                Create Contact List
                            </button>
                        </div>

                        {/* Contact Lists Table or Empty State */}
                        {isLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
                                <div style={{ width: '2rem', height: '2rem', border: '3px solid #f0f0f0', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#666' }}>Loading contact lists...</p>
                            </div>
                        ) : (
                            <>
                                {contactLists.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                                        <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'linear-gradient(145deg, #f5f5f5 0%, #e8e8e8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', marginBottom: '1.5rem' }}>
                                            <Users size={32} />
                                        </div>
                                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 500, color: '#1a1a1a' }}>No contact lists yet</h2>
                                        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9375rem', color: '#666', maxWidth: '400px' }}>Create your first contact list to start managing your contacts</p>
                                        <button
                                            className="button button--primary"
                                            onClick={handleCreateList}
                                        >
                                            <PlusCircle size={18} />
                                            Create Contact List
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredContactLists.length === 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' }}>
                                                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 500, color: '#1a1a1a' }}>No matching contact lists</h2>
                                                <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9375rem', color: '#666' }}>No contact lists match your search criteria</p>
                                                <button
                                                    className="button button--secondary"
                                                    onClick={() => setSearchQuery('')}
                                                >
                                                    Clear Search
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="contact-lists-table-wrapper">
                                                <table className="campaigns-table">
                                                    <thead>
                                                        <tr>
                                                            <th>List Name</th>
                                                            <th>Contacts</th>
                                                            <th>Created</th>
                                                            <th>Status</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredContactLists.map((list) => (
                                                            <tr key={list._id}>
                                                                <td className="campaign-col">
                                                                    <div className="campaign-info">
                                                                        <div>
                                                                            <div style={{ fontWeight: '500' }}>
                                                                                <Link
                                                                                    style={{ color: '#000' }}
                                                                                    href={`/brands/${id}/contacts/${list._id}`}
                                                                                >
                                                                                    {list.name}
                                                                                </Link>
                                                                            </div>
                                                                            {list.description && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>{list.description}</div>}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="stats-value">
                                                                        <span style={{ fontWeight: '500' }}>{list.contactCount || 0}</span>
                                                                    </div>
                                                                </td>
                                                                <td>{formatDate(list.createdAt)}</td>
                                                                <td>
                                                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>Active</span>
                                                                </td>
                                                                <td className="actions-col">
                                                                    <div className="action-buttons">
                                                                        <Link
                                                                            href={`/brands/${id}/contacts/${list._id}`}
                                                                            className="action-btn"
                                                                            title="View Details"
                                                                        >
                                                                            <Eye />
                                                                        </Link>
                                                                        <button
                                                                            className="action-btn"
                                                                            onClick={(e) => handleImportContacts(e, list._id, 'manual')}
                                                                            title="Add Contact"
                                                                        >
                                                                            <UserPlus size={16} />
                                                                            Add
                                                                        </button>
                                                                        <button
                                                                            className="action-btn"
                                                                            onClick={(e) => handleImportContacts(e, list._id, 'csv')}
                                                                            title="Import CSV"
                                                                        >
                                                                            <UploadCloud size={16} />
                                                                            Import
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Segments Tab */}
                {activeTab === 'segments' && (
                    <>
                        {/* Search and Create Bar */}
                        <div className="campaigns-header">
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <Search
                                        size={18}
                                        className="search-icon"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search segments..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>
                            <button
                                className="button button--primary"
                                onClick={handleCreateSegment}
                            >
                                <PlusSign size={18} />
                                Create Segment
                            </button>
                        </div>

                        {/* Segments List */}
                        {isLoadingSegments ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
                                <div style={{ width: '2rem', height: '2rem', border: '3px solid #f0f0f0', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#666' }}>Loading segments...</p>
                            </div>
                        ) : (
                            <>
                                {segments.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                                        <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'linear-gradient(145deg, #f5f5f5 0%, #e8e8e8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', marginBottom: '1.5rem' }}>
                                            <Filter size={32} />
                                        </div>
                                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 500, color: '#1a1a1a' }}>No segments yet</h2>
                                        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9375rem', color: '#666', maxWidth: '400px' }}>Segments allow you to target specific groups of contacts based on tags, custom fields, or other criteria. Create your first segment to get started.</p>
                                        <button
                                            className="button button--primary"
                                            onClick={handleCreateSegment}
                                        >
                                            <PlusCircle size={18} />
                                            Create Segment
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredSegments.length === 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' }}>
                                                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 500, color: '#1a1a1a' }}>No matching segments</h2>
                                                <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9375rem', color: '#666' }}>No segments match your search criteria</p>
                                                <button
                                                    className="button button--secondary"
                                                    onClick={() => setSearchQuery('')}
                                                >
                                                    Clear Search
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table
                                                    className="campaigns-table"
                                                    style={{ tableLayout: 'fixed', width: '100%', minWidth: '800px' }}
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '22%' }}>Segment Name</th>
                                                            <th style={{ width: '10%' }}>Type</th>
                                                            <th style={{ width: '25%' }}>Contact Lists</th>
                                                            <th style={{ width: '18%' }}>Conditions</th>
                                                            <th style={{ width: '10%' }}>Contacts</th>
                                                            <th style={{ width: '15%' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredSegments.map((segment) => (
                                                            <tr key={segment._id}>
                                                                <td style={{ maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        <div
                                                                            style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                                            title={segment.name}
                                                                        >
                                                                            {segment.name}
                                                                        </div>
                                                                        {segment.description && (
                                                                            <div
                                                                                style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                                                title={segment.description}
                                                                            >
                                                                                {segment.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>{getSegmentTypeBadge(segment.type)}</td>
                                                                <td style={{ maxWidth: '0', overflow: 'hidden' }}>{getContactListNames(segment.contactListIds)}</td>
                                                                <td>
                                                                    <span style={{ fontSize: '0.8125rem', color: '#666' }}>{getRuleDescription(segment)}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="stats-value">
                                                                        <span style={{ fontWeight: '500' }}>~{segment.cachedCount || 0}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="action-buttons">
                                                                        <button
                                                                            className="action-btn"
                                                                            onClick={() => handleEditSegment(segment)}
                                                                            title="Edit Segment"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="action-btn delete-btn"
                                                                            onClick={() => handleDeleteSegment(segment._id)}
                                                                            title="Delete Segment"
                                                                        >
                                                                            <Trash size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showCreateListModal && (
                <CreateContactListModal
                    brandId={id}
                    onClose={() => setShowCreateListModal(false)}
                    onSuccess={handleCreateListSuccess}
                />
            )}

            {showImportModal && (
                <ImportContactsModal
                    brandId={id}
                    listId={selectedListId}
                    method={importMethod}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                />
            )}

            {showSegmentModal && (
                <SegmentFormModal
                    brandId={id}
                    segment={editingSegment}
                    contactLists={contactLists}
                    availableTags={availableTags}
                    onClose={() => {
                        setShowSegmentModal(false);
                        setEditingSegment(null);
                    }}
                    onSave={handleSegmentSaved}
                />
            )}
        </BrandLayout>
    );
}

// Segment Form Modal Component - Updated with customFields support
function SegmentFormModal({ brandId, segment, contactLists, availableTags, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: segment?.name || '',
        description: segment?.description || '',
        type: segment?.type || 'dynamic',
        contactListIds: segment?.contactListIds || [],
        conditions: segment?.conditions || {
            matchType: 'all',
            rules: [],
        },
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState([]);
    const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(true);

    // Fetch available custom fields
    useEffect(() => {
        fetchCustomFields();
    }, [brandId]);

    const fetchCustomFields = async () => {
        try {
            setIsLoadingCustomFields(true);
            const res = await fetch(`/api/brands/${brandId}/contacts/custom-fields`, {
                credentials: 'same-origin',
            });

            if (res.ok) {
                const data = await res.json();
                setCustomFields(data.fields || []);
            }
        } catch (error) {
            console.error('Error fetching custom fields:', error);
        } finally {
            setIsLoadingCustomFields(false);
        }
    };

    const fieldOptions = [
        { value: 'email', label: 'Email', type: 'text' },
        { value: 'firstName', label: 'First Name', type: 'text' },
        { value: 'lastName', label: 'Last Name', type: 'text' },
        { value: 'phone', label: 'Phone', type: 'text' },
        { value: 'status', label: 'Status', type: 'status' },
        { value: 'tags', label: 'Tags', type: 'tags' },
        { value: 'createdAt', label: 'Created Date', type: 'date' },
        { value: 'customField', label: '— Custom Field —', type: 'custom' },
    ];

    const operatorOptions = {
        text: [
            { value: 'equals', label: 'Equals' },
            { value: 'not_equals', label: 'Does not equal' },
            { value: 'contains', label: 'Contains' },
            { value: 'not_contains', label: 'Does not contain' },
            { value: 'starts_with', label: 'Starts with' },
            { value: 'ends_with', label: 'Ends with' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' },
        ],
        number: [
            { value: 'equals', label: 'Equals' },
            { value: 'not_equals', label: 'Does not equal' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' },
        ],
        tags: [
            { value: 'has_tag', label: 'Has tag' },
            { value: 'missing_tag', label: 'Missing tag' },
            { value: 'has_any_tag', label: 'Has any of these tags' },
            { value: 'has_all_tags', label: 'Has all of these tags' },
        ],
        date: [
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
        ],
        status: [
            { value: 'equals', label: 'Is' },
            { value: 'not_equals', label: 'Is not' },
        ],
        boolean: [{ value: 'equals', label: 'Is' }],
    };

    const getOperatorsForField = (field, customFieldName = null) => {
        if (field === 'tags') return operatorOptions.tags;
        if (field === 'createdAt') return operatorOptions.date;
        if (field === 'status') return operatorOptions.status;

        // For custom fields, try to determine the type
        if (field === 'customField' && customFieldName) {
            const customField = customFields.find((cf) => cf.name === customFieldName);
            if (customField) {
                if (customField.type === 'number') return operatorOptions.number;
                if (customField.type === 'date') return operatorOptions.date;
                if (customField.type === 'boolean') return operatorOptions.boolean;
            }
        }

        return operatorOptions.text;
    };

    const addRule = () => {
        setFormData((prev) => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                rules: [...prev.conditions.rules, { field: 'email', operator: 'contains', value: '', customFieldName: '' }],
            },
        }));
    };

    const updateRule = (index, updates) => {
        setFormData((prev) => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                rules: prev.conditions.rules.map((rule, i) => (i === index ? { ...rule, ...updates } : rule)),
            },
        }));
    };

    const removeRule = (index) => {
        setFormData((prev) => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                rules: prev.conditions.rules.filter((_, i) => i !== index),
            },
        }));
    };

    const toggleContactList = (listId) => {
        setFormData((prev) => ({
            ...prev,
            contactListIds: prev.contactListIds.includes(listId) ? prev.contactListIds.filter((id) => id !== listId) : [...prev.contactListIds, listId],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Please enter a segment name');
            return;
        }

        // Validate custom field rules
        const invalidRules = formData.conditions.rules.filter((rule) => rule.field === 'customField' && !rule.customFieldName);
        if (invalidRules.length > 0) {
            setError('Please select a custom field for all custom field conditions');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const url = segment ? `/api/brands/${brandId}/segments/${segment._id}` : `/api/brands/${brandId}/segments`;

            const res = await fetch(url, {
                method: segment ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save segment');
            }

            const savedSegment = await res.json();
            onSave(savedSegment);
        } catch (error) {
            console.error('Error saving segment:', error);
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getValueInput = (rule, index) => {
        // Skip value input for empty/not empty operators
        if (['is_empty', 'is_not_empty'].includes(rule.operator)) {
            return null;
        }

        const inputStyle = {
            flex: '2 1 150px',
            minWidth: '150px',
            padding: '0.5rem 0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            backgroundColor: '#fff',
        };

        // Tags field
        if (rule.field === 'tags') {
            return (
                <select
                    value={rule.value}
                    onChange={(e) => updateRule(index, { value: e.target.value })}
                    style={inputStyle}
                >
                    <option value="">Select a tag...</option>
                    {availableTags.map((tag) => (
                        <option
                            key={tag.name}
                            value={tag.name}
                        >
                            {tag.name} ({tag.count})
                        </option>
                    ))}
                </select>
            );
        }

        // Status field
        if (rule.field === 'status') {
            return (
                <select
                    value={rule.value}
                    onChange={(e) => updateRule(index, { value: e.target.value })}
                    style={inputStyle}
                >
                    <option value="">Select status...</option>
                    <option value="active">Active</option>
                    <option value="unsubscribed">Unsubscribed</option>
                    <option value="bounced">Bounced</option>
                    <option value="complained">Complained</option>
                </select>
            );
        }

        // Date field
        if (rule.field === 'createdAt') {
            return (
                <input
                    type="date"
                    value={rule.value}
                    onChange={(e) => updateRule(index, { value: e.target.value })}
                    style={inputStyle}
                />
            );
        }

        // Custom field - determine input type based on custom field type
        if (rule.field === 'customField' && rule.customFieldName) {
            const customField = customFields.find((cf) => cf.name === rule.customFieldName);

            if (customField) {
                // Boolean custom field
                if (customField.type === 'boolean') {
                    return (
                        <select
                            value={rule.value}
                            onChange={(e) => updateRule(index, { value: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Select...</option>
                            <option value="true">True / Yes</option>
                            <option value="false">False / No</option>
                        </select>
                    );
                }

                // Date custom field
                if (customField.type === 'date') {
                    return (
                        <input
                            type="date"
                            value={rule.value}
                            onChange={(e) => updateRule(index, { value: e.target.value })}
                            style={inputStyle}
                        />
                    );
                }

                // Number custom field
                if (customField.type === 'number') {
                    return (
                        <input
                            type="number"
                            value={rule.value}
                            onChange={(e) => updateRule(index, { value: e.target.value })}
                            placeholder="Enter number..."
                            style={inputStyle}
                        />
                    );
                }

                // If custom field has predefined values (like a select)
                if (customField.values && customField.values.length > 0) {
                    return (
                        <select
                            value={rule.value}
                            onChange={(e) => updateRule(index, { value: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Select value...</option>
                            {customField.values.map((val) => (
                                <option
                                    key={val}
                                    value={val}
                                >
                                    {val}
                                </option>
                            ))}
                        </select>
                    );
                }
            }
        }

        // Default text input
        return (
            <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(index, { value: e.target.value })}
                placeholder="Value..."
                style={inputStyle}
            />
        );
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '0.75rem',
                    width: '100%',
                    maxWidth: '750px',
                    maxHeight: 'calc(100vh - 2rem)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
            >
                {/* Fixed Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #f0f0f0',
                        flexShrink: 0,
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a' }}>{segment ? 'Edit Segment' : 'Create Segment'}</h2>
                    <button
                        onClick={onClose}
                        type="button"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.375rem',
                            color: '#666',
                            transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.5rem',
                    }}
                >
                    {error && (
                        <div
                            style={{
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '0.5rem',
                                color: '#dc2626',
                                fontSize: '0.875rem',
                            }}
                        >
                            <span>{error}</span>
                        </div>
                    )}

                    <form
                        id="segment-form"
                        onSubmit={handleSubmit}
                    >
                        {/* Basic Info */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>
                                Segment Name<span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Active Users, Premium Customers"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.875rem',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.9375rem',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this segment represents..."
                                rows={2}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.875rem',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.9375rem',
                                    resize: 'vertical',
                                    minHeight: '60px',
                                }}
                            />
                        </div>

                        {/* Contact Lists */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>Apply to Contact Lists</label>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: '#666' }}>Select which contact lists this segment should filter. Leave empty to include all lists.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {contactLists.map((list) => (
                                    <button
                                        key={list._id}
                                        type="button"
                                        onClick={() => toggleContactList(list._id)}
                                        style={{
                                            padding: '0.5rem 0.875rem',
                                            borderRadius: '0.375rem',
                                            border: formData.contactListIds.includes(list._id) ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                                            background: formData.contactListIds.includes(list._id) ? '#f5f5f5' : '#fff',
                                            cursor: 'pointer',
                                            fontSize: '0.8125rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {formData.contactListIds.includes(list._id) && <Check size={14} />}
                                        {list.name}
                                        <span style={{ color: '#999', fontSize: '0.75rem' }}>({list.contactCount || 0})</span>
                                    </button>
                                ))}
                                {contactLists.length === 0 && <p style={{ margin: 0, fontSize: '0.8125rem', color: '#999', fontStyle: 'italic' }}>No contact lists available</p>}
                            </div>
                        </div>

                        {/* Conditions */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>Filter Conditions</label>

                            {/* Match Type */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.875rem', color: '#666' }}>Match</span>
                                <select
                                    value={formData.conditions.matchType}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            conditions: { ...prev.conditions, matchType: e.target.value },
                                        }))
                                    }
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    <option value="all">ALL conditions</option>
                                    <option value="any">ANY condition</option>
                                </select>
                            </div>

                            {/* Custom Fields Info */}
                            {customFields.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.625rem 0.875rem',
                                        backgroundColor: '#f0f9ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '0.5rem',
                                        marginBottom: '1rem',
                                        fontSize: '0.8125rem',
                                        color: '#1e40af',
                                    }}
                                >
                                    <Tag size={14} />
                                    <span>
                                        {customFields.length} custom field{customFields.length !== 1 ? 's' : ''} available for filtering
                                    </span>
                                </div>
                            )}

                            {/* Rules */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {formData.conditions.rules.map((rule, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.5rem',
                                            padding: '0.875rem',
                                            background: '#fafafa',
                                            borderRadius: '0.5rem',
                                            flexWrap: 'wrap',
                                            border: '1px solid #f0f0f0',
                                        }}
                                    >
                                        {/* Field Selector */}
                                        <select
                                            value={rule.field}
                                            onChange={(e) => {
                                                const newField = e.target.value;
                                                const newOperators = getOperatorsForField(newField);
                                                updateRule(index, {
                                                    field: newField,
                                                    operator: newOperators[0].value,
                                                    value: '',
                                                    customFieldName: newField === 'customField' ? '' : undefined,
                                                });
                                            }}
                                            style={{
                                                flex: '1 1 130px',
                                                minWidth: '130px',
                                                padding: '0.5rem 0.75rem',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                backgroundColor: '#fff',
                                            }}
                                        >
                                            <optgroup label="Standard Fields">
                                                {fieldOptions
                                                    .filter((opt) => opt.value !== 'customField')
                                                    .map((opt) => (
                                                        <option
                                                            key={opt.value}
                                                            value={opt.value}
                                                        >
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                            </optgroup>
                                            {customFields.length > 0 && (
                                                <optgroup label="Custom Fields">
                                                    <option value="customField">Custom Field...</option>
                                                </optgroup>
                                            )}
                                        </select>

                                        {/* Custom Field Name Selector (only shown when customField is selected) */}
                                        {rule.field === 'customField' && (
                                            <select
                                                value={rule.customFieldName || ''}
                                                onChange={(e) => {
                                                    const customFieldName = e.target.value;
                                                    const newOperators = getOperatorsForField('customField', customFieldName);
                                                    updateRule(index, {
                                                        customFieldName,
                                                        operator: newOperators[0].value,
                                                        value: '',
                                                    });
                                                }}
                                                style={{
                                                    flex: '1 1 140px',
                                                    minWidth: '140px',
                                                    padding: '0.5rem 0.75rem',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.875rem',
                                                    backgroundColor: rule.customFieldName ? '#fff' : '#fffbeb',
                                                    borderColor: rule.customFieldName ? '#e0e0e0' : '#fbbf24',
                                                }}
                                            >
                                                <option value="">Select field...</option>
                                                {customFields.map((cf) => (
                                                    <option
                                                        key={cf.name}
                                                        value={cf.name}
                                                    >
                                                        {cf.name} {cf.type && `(${cf.type})`}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {/* Operator */}
                                        <select
                                            value={rule.operator}
                                            onChange={(e) => updateRule(index, { operator: e.target.value })}
                                            style={{
                                                flex: '1 1 140px',
                                                minWidth: '140px',
                                                padding: '0.5rem 0.75rem',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                backgroundColor: '#fff',
                                            }}
                                        >
                                            {getOperatorsForField(rule.field, rule.customFieldName).map((opt) => (
                                                <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Value Input */}
                                        {getValueInput(rule, index)}

                                        {/* Remove Button */}
                                        <button
                                            type="button"
                                            onClick={() => removeRule(index)}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#dc2626',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderRadius: '0.375rem',
                                                transition: 'background-color 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}

                                {formData.conditions.rules.length === 0 && (
                                    <div
                                        style={{
                                            padding: '1.5rem',
                                            textAlign: 'center',
                                            backgroundColor: '#fafafa',
                                            borderRadius: '0.5rem',
                                            border: '1px dashed #e0e0e0',
                                        }}
                                    >
                                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#666' }}>No conditions added. This segment will include all contacts from selected lists.</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addRule}
                                    style={{
                                        alignSelf: 'flex-start',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        padding: '0.5rem 0.875rem',
                                        backgroundColor: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.8125rem',
                                        color: '#333',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                        e.currentTarget.style.borderColor = '#ccc';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                    }}
                                >
                                    <PlusCircle size={16} />
                                    Add Condition
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        padding: '1.25rem 1.5rem',
                        borderTop: '1px solid #f0f0f0',
                        backgroundColor: '#fafafa',
                        flexShrink: 0,
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            padding: '0.625rem 1.25rem',
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#333',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.6 : 1,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="segment-form"
                        disabled={isSubmitting}
                        style={{
                            padding: '0.625rem 1.25rem',
                            backgroundColor: '#1a1a1a',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#fff',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                                Saving...
                            </>
                        ) : segment ? (
                            'Update Segment'
                        ) : (
                            'Create Segment'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
