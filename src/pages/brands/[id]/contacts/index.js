// src/pages/brands/[id]/contacts/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import BrandLayout from '@/components/BrandLayout';
import { PlusCircle, Search, Users, Trash, UploadCloud, UserPlus, Filter, Tag, Edit2, X, ChevronDown, Check, Eye, Plus } from 'lucide-react';
import CreateContactListModal from '@/components/contact/CreateContactListModal';
import ImportContactsModal from '@/components/contact/ImportContactsModal';
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
            return <span className="segment-type-badge segment-type-badge--static">Static</span>;
        }
        return <span className="segment-type-badge segment-type-badge--dynamic">Dynamic</span>;
    };

    const getContactListNames = (contactListIds) => {
        if (!contactListIds || contactListIds.length === 0) {
            return <span className="contact-list-all">All lists</span>;
        }

        const listNames = contactListIds
            .map((listId) => {
                const list = contactLists.find((l) => l._id === listId);
                return list ? list.name : null;
            })
            .filter(Boolean);

        if (listNames.length === 0) {
            return <span className="contact-list-all">All lists</span>;
        }

        const displayLimit = 2;
        const displayedLists = listNames.slice(0, displayLimit);
        const remainingCount = listNames.length - displayLimit;

        return (
            <div className="contact-list-pills">
                {displayedLists.map((name, index) => (
                    <span key={index} className="contact-list-pill" title={name}>{name}</span>
                ))}
                {remainingCount > 0 && (
                    <span className="contact-list-pill-more" title={listNames.slice(displayLimit).join(', ')}>
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
                <div className="contacts-tabs">
                    <button
                        onClick={() => setActiveTab('lists')}
                        className={`contacts-tab ${activeTab === 'lists' ? 'active' : ''}`}
                    >
                        <Users size={18} />
                        Contact Lists
                        {contactLists.length > 0 && (
                            <span className="contacts-tab-count">{contactLists.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('segments')}
                        className={`contacts-tab ${activeTab === 'segments' ? 'active' : ''}`}
                    >
                        <Filter size={18} />
                        Segments
                        {segments.length > 0 && (
                            <span className="contacts-tab-count">{segments.length}</span>
                        )}
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="contacts-alert contacts-alert--error">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="contacts-alert-close">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="contacts-alert contacts-alert--success">
                        <span>{success}</span>
                        <button onClick={() => setSuccess('')} className="contacts-alert-close">
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
                                <Plus size={18} />
                                Create Contact List
                            </button>
                        </div>

                        {/* Contact Lists Table or Empty State */}
                        {isLoading ? (
                            <div className="contacts-loading">
                                <div className="spinner"></div>
                                <p>Loading contact lists...</p>
                            </div>
                        ) : (
                            <>
                                {contactLists.length === 0 ? (
                                    <div className="contacts-empty">
                                        <div className="contacts-empty-icon">
                                            <Users size={32} />
                                        </div>
                                        <h2 className="contacts-empty-title">No contact lists yet</h2>
                                        <p className="contacts-empty-desc">Create your first contact list to start managing your contacts</p>
                                        <button className="button button--primary" onClick={handleCreateList}>
                                            <PlusCircle size={18} />
                                            Create Contact List
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredContactLists.length === 0 ? (
                                            <div className="contacts-empty contacts-search-empty">
                                                <h2 className="contacts-empty-title">No matching contact lists</h2>
                                                <p className="contacts-empty-desc">No contact lists match your search criteria</p>
                                                <button className="button button--secondary" onClick={() => setSearchQuery('')}>
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
                                                                    <div className="list-name-cell">
                                                                        <Link href={`/brands/${id}/contacts/${list._id}`} className="list-name">
                                                                            {list.name}
                                                                        </Link>
                                                                        {list.description && <div className="list-description">{list.description}</div>}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="stats-value">{list.contactCount || 0}</div>
                                                                </td>
                                                                <td>{formatDate(list.createdAt)}</td>
                                                                <td>
                                                                    <span className="status-badge status-badge--active">Active</span>
                                                                </td>
                                                                <td className="actions-col">
                                                                    <div className="contacts-action-buttons">
                                                                        <Link href={`/brands/${id}/contacts/${list._id}`} className="contacts-action-btn" title="View Details">
                                                                            <Eye size={16} />
                                                                        </Link>
                                                                        <button className="contacts-action-btn" onClick={(e) => handleImportContacts(e, list._id, 'manual')} title="Add Contact">
                                                                            <UserPlus size={16} />
                                                                            Add
                                                                        </button>
                                                                        <button className="contacts-action-btn" onClick={(e) => handleImportContacts(e, list._id, 'csv')} title="Import CSV">
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
                                <Plus size={18} />
                                Create Segment
                            </button>
                        </div>

                        {/* Segments List */}
                        {isLoadingSegments ? (
                            <div className="contacts-loading">
                                <div className="spinner"></div>
                                <p>Loading segments...</p>
                            </div>
                        ) : (
                            <>
                                {segments.length === 0 ? (
                                    <div className="contacts-empty">
                                        <div className="contacts-empty-icon">
                                            <Filter size={32} />
                                        </div>
                                        <h2 className="contacts-empty-title">No segments yet</h2>
                                        <p className="contacts-empty-desc">Segments allow you to target specific groups of contacts based on tags, custom fields, or other criteria. Create your first segment to get started.</p>
                                        <button className="button button--primary" onClick={handleCreateSegment}>
                                            <PlusCircle size={18} />
                                            Create Segment
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredSegments.length === 0 ? (
                                            <div className="contacts-empty contacts-search-empty">
                                                <h2 className="contacts-empty-title">No matching segments</h2>
                                                <p className="contacts-empty-desc">No segments match your search criteria</p>
                                                <button className="button button--secondary" onClick={() => setSearchQuery('')}>
                                                    Clear Search
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="table-wrapper">
                                                <table className="campaigns-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Segment Name</th>
                                                            <th>Type</th>
                                                            <th>Contact Lists</th>
                                                            <th>Conditions</th>
                                                            <th>Contacts</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredSegments.map((segment) => (
                                                            <tr key={segment._id}>
                                                                <td className="campaign-col">
                                                                    <div className="list-name-cell">
                                                                        <div className="list-name" title={segment.name}>{segment.name}</div>
                                                                        {segment.description && (
                                                                            <div className="list-description" title={segment.description}>{segment.description}</div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>{getSegmentTypeBadge(segment.type)}</td>
                                                                <td>{getContactListNames(segment.contactListIds)}</td>
                                                                <td>
                                                                    <span className="rule-description">{getRuleDescription(segment)}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="stats-value">~{segment.cachedCount || 0}</div>
                                                                </td>
                                                                <td className="actions-col">
                                                                    <div className="contacts-action-buttons">
                                                                        <button className="contacts-action-btn" onClick={() => handleEditSegment(segment)} title="Edit Segment">
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button className="contacts-action-btn delete-btn" onClick={() => handleDeleteSegment(segment._id)} title="Delete Segment">
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

        // Tags field
        if (rule.field === 'tags') {
            return (
                <select
                    value={rule.value}
                    onChange={(e) => updateRule(index, { value: e.target.value })}
                    className="segment-rule-select segment-rule-input--value"
                >
                    <option value="">Select a tag...</option>
                    {availableTags.map((tag) => (
                        <option key={tag.name} value={tag.name}>{tag.name} ({tag.count})</option>
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
                    className="segment-rule-select segment-rule-input--value"
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
                    className="segment-rule-input segment-rule-input--value"
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
                            className="segment-rule-select segment-rule-input--value"
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
                            className="segment-rule-input segment-rule-input--value"
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
                            className="segment-rule-input segment-rule-input--value"
                        />
                    );
                }

                // If custom field has predefined values (like a select)
                if (customField.values && customField.values.length > 0) {
                    return (
                        <select
                            value={rule.value}
                            onChange={(e) => updateRule(index, { value: e.target.value })}
                            className="segment-rule-select segment-rule-input--value"
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
                className="segment-rule-input segment-rule-input--value"
            />
        );
    };

    return (
        <div
            className="segment-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="segment-modal">
                {/* Fixed Header */}
                <div className="segment-modal-header">
                    <h2 className="segment-modal-title">{segment ? 'Edit Segment' : 'Create Segment'}</h2>
                    <button
                        onClick={onClose}
                        type="button"
                        className="segment-modal-close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="segment-modal-body">
                    {error && (
                        <div className="segment-form-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <form
                        id="segment-form"
                        onSubmit={handleSubmit}
                    >
                        {/* Basic Info */}
                        <div className="segment-form-group">
                            <label className="segment-form-label">
                                Segment Name<span className="segment-form-required">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Active Users, Premium Customers"
                                className="segment-form-input"
                            />
                        </div>

                        <div className="segment-form-group">
                            <label className="segment-form-label">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this segment represents..."
                                rows={2}
                                className="segment-form-textarea"
                            />
                        </div>

                        {/* Contact Lists */}
                        <div className="segment-form-group">
                            <label className="segment-form-label">Apply to Contact Lists</label>
                            <p className="segment-form-hint">Select which contact lists this segment should filter. Leave empty to include all lists.</p>
                            <div className="segment-list-chips">
                                {contactLists.map((list) => (
                                    <button
                                        key={list._id}
                                        type="button"
                                        onClick={() => toggleContactList(list._id)}
                                        className={`segment-list-chip ${formData.contactListIds.includes(list._id) ? 'selected' : ''}`}
                                    >
                                        {formData.contactListIds.includes(list._id) && <Check size={14} />}
                                        {list.name}
                                        <span className="segment-list-chip-count">({list.contactCount || 0})</span>
                                    </button>
                                ))}
                                {contactLists.length === 0 && <p className="segment-no-lists">No contact lists available</p>}
                            </div>
                        </div>

                        {/* Conditions */}
                        <div className="segment-form-group">
                            <label className="segment-form-label">Filter Conditions</label>

                            {/* Match Type */}
                            <div className="segment-match-type">
                                <span className="segment-match-label">Match</span>
                                <select
                                    value={formData.conditions.matchType}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            conditions: { ...prev.conditions, matchType: e.target.value },
                                        }))
                                    }
                                    className="segment-match-select"
                                >
                                    <option value="all">ALL conditions</option>
                                    <option value="any">ANY condition</option>
                                </select>
                            </div>

                            {/* Custom Fields Info */}
                            {customFields.length > 0 && (
                                <div className="segment-custom-fields-info">
                                    <Tag size={14} />
                                    <span>
                                        {customFields.length} custom field{customFields.length !== 1 ? 's' : ''} available for filtering
                                    </span>
                                </div>
                            )}

                            {/* Rules */}
                            <div className="segment-rules">
                                {formData.conditions.rules.map((rule, index) => (
                                    <div key={index} className="segment-rule">
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
                                            className="segment-rule-select segment-rule-select--field"
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
                                                className={`segment-rule-select segment-rule-select--custom ${!rule.customFieldName ? 'segment-rule-select--warning' : ''}`}
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
                                            className="segment-rule-select segment-rule-select--operator"
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
                                            className="segment-rule-remove"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}

                                {formData.conditions.rules.length === 0 && (
                                    <div className="segment-rules-empty">
                                        <p>No conditions added. This segment will include all contacts from selected lists.</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addRule}
                                    className="segment-add-rule-btn"
                                >
                                    <PlusCircle size={16} />
                                    Add Condition
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="segment-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="button button--secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="segment-form"
                        disabled={isSubmitting}
                        className="button button--primary"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-small"></span>
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
