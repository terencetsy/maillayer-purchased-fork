import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Database, Eye, EyeOff, Save, Check, X, Trash, AlertTriangle, Info } from 'lucide-react';

export default function AirtableIntegration() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [brand, setBrand] = useState(null);
    const [integration, setIntegration] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [name, setName] = useState('Airtable Integration');
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id) {
            fetchBrandDetails();
            fetchAirtableIntegration();
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
        }
    };

    const fetchAirtableIntegration = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/integrations/airtable`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch Airtable integration');
            }

            const data = await res.json();

            if (data) {
                setIntegration(data);
                setName(data.name || 'Airtable Integration');
            }
        } catch (error) {
            console.error('Error fetching Airtable integration:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleShowApiKey = () => {
        setShowApiKey(!showApiKey);
    };

    const saveIntegration = async () => {
        try {
            setError('');
            setSuccess('');
            setIsSaving(true);

            if (!apiKey && !integration) {
                setError('Please enter your Airtable API key');
                setIsSaving(false);
                return;
            }

            const res = await fetch(`/api/brands/${id}/integrations/airtable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    apiKey: apiKey || integration?.config?.apiKey || '',
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save Airtable integration');
            }

            const data = await res.json();
            setIntegration(data);
            setSuccess('Airtable integration saved successfully');

            // Clear API key input
            setApiKey('');

            // Refresh integration data
            fetchAirtableIntegration();
        } catch (error) {
            console.error('Error saving Airtable integration:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteIntegration = async () => {
        if (!integration) return;

        try {
            setError('');
            setSuccess('');
            setIsSaving(true);

            const res = await fetch(`/api/brands/${id}/integrations/${integration._id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete Airtable integration');
            }

            setSuccess('Airtable integration deleted successfully');
            setIntegration(null);
            setShowDeleteConfirm(false);

            // Reset form
            setName('Airtable Integration');
            setApiKey('');
        } catch (error) {
            console.error('Error deleting Airtable integration:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !brand) return null;

    return (
        <BrandLayout brand={brand}>
            <div className="airtable-integration-container">
                <div className="integration-header">
                    <Link
                        href={`/brands/${id}/integrations`}
                        className="back-link"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Integrations</span>
                    </Link>

                    <div className="header-content">
                        <div className="header-icon airtable">
                            <Database size={24} />
                        </div>
                        <div className="header-text">
                            <h1>Airtable Integration</h1>
                            <p>Connect your Airtable account to import contacts and sync data</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                        <button
                            onClick={() => setError('')}
                            className="close-alert"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <Check size={16} />
                        <span>{success}</span>
                        <button
                            onClick={() => setSuccess('')}
                            className="close-alert"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Integration status */}
                {integration && (
                    <div className="integration-status-panel">
                        <div className="status-indicator active">
                            <div className="status-dot"></div>
                            <span>Connected to Airtable</span>
                        </div>
                        <div className="status-meta">
                            <span>Connected on {new Date(integration.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Last updated: {new Date(integration.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}

                <div className="integration-setup-container">
                    <div className="setup-card">
                        <div className="setup-header">
                            <h2>{integration ? 'Airtable Integration Settings' : 'Connect to Airtable'}</h2>
                            {integration && (
                                <button
                                    className="delete-button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isSaving}
                                >
                                    <Trash size={16} />
                                    <span>Disconnect</span>
                                </button>
                            )}
                        </div>

                        <div className="setup-form">
                            <div className="form-group">
                                <label htmlFor="integration-name">Integration Name</label>
                                <input
                                    type="text"
                                    id="integration-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Airtable Integration"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="api-key-section">
                                <h3>API Key</h3>
                                <p className="section-description">Enter your Airtable API key to connect to your Airtable account.</p>

                                {integration ? (
                                    <div className="current-connection">
                                        <div className="connection-info">
                                            <div className="info-item">
                                                <span className="label">API Key:</span>
                                                <span className="value api-key">
                                                    {showApiKey ? integration.config.apiKey : '••••••••••••••••••••••••••'}
                                                    <button
                                                        className="toggle-visibility"
                                                        onClick={toggleShowApiKey}
                                                        type="button"
                                                    >
                                                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="update-api-key">
                                            <p>To update your API key, enter a new one below:</p>
                                            <div className="api-key-input-group">
                                                <input
                                                    type={showApiKey ? 'text' : 'password'}
                                                    id="api-key"
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    placeholder="Enter new API key"
                                                    disabled={isSaving}
                                                    className="api-key-input"
                                                />
                                                <button
                                                    className="toggle-visibility-button"
                                                    onClick={toggleShowApiKey}
                                                    type="button"
                                                >
                                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="api-key-section-2">
                                        <div className="instructions">
                                            <div className="instruction-note">
                                                <Info size={16} />
                                                <p>To get your Airtable API key, go to your Airtable account settings and under the API section, generate or view your API key.</p>
                                            </div>
                                        </div>

                                        <div className="api-key-input-group">
                                            <input
                                                type={showApiKey ? 'text' : 'password'}
                                                id="api-key"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="Enter your Airtable API key"
                                                disabled={isSaving}
                                                className="api-key-input"
                                            />
                                            <button
                                                className="toggle-visibility-button"
                                                onClick={toggleShowApiKey}
                                                type="button"
                                            >
                                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button
                                    className="save-button"
                                    onClick={saveIntegration}
                                    disabled={isSaving || (!apiKey && !integration)}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="spinner-sm"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            <span>{integration ? 'Update Integration' : 'Connect Airtable'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete confirmation modal */}
                {showDeleteConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-container delete-modal">
                            <div className="modal-header">
                                <h3>Disconnect Airtable</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isSaving}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="modal-content">
                                <div className="warning-icon">
                                    <AlertTriangle size={32} />
                                </div>
                                <p>Are you sure you want to disconnect Airtable integration?</p>
                                <p className="warning-text">This will disable all Airtable-related functionality, including data imports and syncing.</p>

                                <div className="modal-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={deleteIntegration}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="spinner-sm"></div>
                                                <span>Disconnecting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash size={16} />
                                                <span>Disconnect</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </BrandLayout>
    );
}
