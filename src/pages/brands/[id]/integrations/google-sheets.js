import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, FileSpreadsheet, Upload, Save, Check, X, Trash, AlertTriangle, Info } from 'lucide-react';

export default function GoogleSheetsIntegration() {
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
    const [name, setName] = useState('Google Sheets Integration');
    const [serviceAccountJson, setServiceAccountJson] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id) {
            fetchBrandDetails();
            fetchGoogleSheetsIntegration();
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

    const fetchGoogleSheetsIntegration = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/integrations/google-sheets`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch Google Sheets integration');
            }

            const data = await res.json();

            if (data) {
                setIntegration(data);
                setName(data.name || 'Google Sheets Integration');
            }
        } catch (error) {
            console.error('Error fetching Google Sheets integration:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadedFile(file);
        setValidationError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target.result;
                const parsedContent = JSON.parse(content);

                // Basic validation
                if (!parsedContent.type || !parsedContent.project_id || !parsedContent.private_key) {
                    setValidationError('Invalid service account file. Missing required fields.');
                    return;
                }

                setServiceAccountJson(content);
            } catch (error) {
                console.error('Error parsing service account JSON:', error);
                setValidationError('Invalid JSON format. Please upload a valid Google service account file.');
            }
        };

        reader.readAsText(file);
    };

    const saveIntegration = async () => {
        try {
            setError('');
            setSuccess('');
            setIsSaving(true);

            if (!serviceAccountJson && !integration) {
                setError('Please upload a Google service account JSON file');
                setIsSaving(false);
                return;
            }

            const res = await fetch(`/api/brands/${id}/integrations/google-sheets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    serviceAccountJson: serviceAccountJson || JSON.stringify(integration.config.serviceAccount),
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save Google Sheets integration');
            }

            const data = await res.json();
            setIntegration(data);
            setSuccess('Google Sheets integration saved successfully');

            // Clear file upload state
            setUploadedFile(null);
            setServiceAccountJson('');

            // Refresh integration data
            fetchGoogleSheetsIntegration();
        } catch (error) {
            console.error('Error saving Google Sheets integration:', error);
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
                throw new Error(data.message || 'Failed to delete Google Sheets integration');
            }

            setSuccess('Google Sheets integration deleted successfully');
            setIntegration(null);
            setShowDeleteConfirm(false);

            // Reset form
            setName('Google Sheets Integration');
            setServiceAccountJson('');
            setUploadedFile(null);
        } catch (error) {
            console.error('Error deleting Google Sheets integration:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !brand) return null;

    return (
        <BrandLayout brand={brand}>
            <div className="google-sheets-integration-container">
                <div className="integration-header">
                    <Link
                        href={`/brands/${id}/integrations`}
                        className="back-link"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Integrations</span>
                    </Link>

                    <div className="header-content">
                        <div className="header-icon google-sheets">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div className="header-text">
                            <h1>Google Sheets Integration</h1>
                            <p>Connect to Google Sheets to import and export contacts data</p>
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
                            <span>Connected to Google Sheets - Project: {integration.config.projectId}</span>
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
                            <h2>{integration ? 'Google Sheets Integration Settings' : 'Connect to Google Sheets'}</h2>
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
                                    placeholder="Google Sheets Integration"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="service-account-section">
                                <h3>Service Account</h3>
                                <p className="section-description">Upload your Google service account JSON file to connect to Google Sheets.</p>

                                {integration ? (
                                    <div className="current-connection">
                                        <div className="connection-info">
                                            <div className="info-item">
                                                <span className="label">Project ID:</span>
                                                <span className="value">{integration.config.projectId}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Client Email:</span>
                                                <span className="value">{integration.config.serviceAccount.client_email}</span>
                                            </div>
                                        </div>

                                        <div className="update-service-account">
                                            <p>To update the service account, upload a new JSON file:</p>
                                            <div className="file-upload-container">
                                                <label
                                                    htmlFor="service-account-file"
                                                    className="file-upload-label"
                                                >
                                                    <Upload size={16} />
                                                    <span>{uploadedFile ? uploadedFile.name : 'Upload New Service Account'}</span>
                                                </label>
                                                <input
                                                    type="file"
                                                    id="service-account-file"
                                                    accept=".json"
                                                    onChange={handleFileChange}
                                                    disabled={isSaving}
                                                    className="file-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="file-upload-section">
                                        <div className="instructions">
                                            <div className="instruction-note">
                                                <Info size={16} />
                                                <p>To get your service account JSON file:</p>
                                                <ol className="instruction-steps">
                                                    <li>
                                                        Go to the{' '}
                                                        <a
                                                            href="https://console.cloud.google.com/projectcreate"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Google Cloud Console
                                                        </a>
                                                    </li>
                                                    <li>Create a project or select an existing one</li>
                                                    <li>Enable the Google Sheets API for the project</li>
                                                    <li>Create a service account with "Editor" permission</li>
                                                    <li>Create a key for the service account (JSON format)</li>
                                                    <li>Download and upload the JSON file below</li>
                                                </ol>
                                            </div>
                                        </div>

                                        <div className="file-upload-container">
                                            <label
                                                htmlFor="service-account-file"
                                                className="file-upload-label primary"
                                            >
                                                <Upload size={16} />
                                                <span>{uploadedFile ? uploadedFile.name : 'Upload Service Account JSON'}</span>
                                            </label>
                                            <input
                                                type="file"
                                                id="service-account-file"
                                                accept=".json"
                                                onChange={handleFileChange}
                                                disabled={isSaving}
                                                className="file-input"
                                            />
                                        </div>

                                        {validationError && (
                                            <div className="validation-error">
                                                <AlertTriangle size={16} />
                                                <span>{validationError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button
                                    className="save-button"
                                    onClick={saveIntegration}
                                    disabled={isSaving || (!serviceAccountJson && !integration)}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="spinner-sm"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            <span>{integration ? 'Update Integration' : 'Connect Google Sheets'}</span>
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
                                <h3>Disconnect Google Sheets</h3>
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
                                <p>Are you sure you want to disconnect Google Sheets integration?</p>
                                <p className="warning-text">This will disable all Google Sheets functionality, including data imports and exports.</p>

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
