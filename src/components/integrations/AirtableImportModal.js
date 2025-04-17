import { useState, useEffect } from 'react';
import { X, FileText, Check, AlertTriangle, Download, RefreshCw } from 'lucide-react';

/**
 * Modal component for importing contacts from Airtable
 */
export default function AirtableImportModal({ brandId, integration, contactLists = [], onClose, onSuccess }) {
    // Form state
    const [selectedListId, setSelectedListId] = useState('');
    const [emailField, setEmailField] = useState('Email');
    const [firstNameField, setFirstNameField] = useState('First Name');
    const [lastNameField, setLastNameField] = useState('Last Name');
    const [skipDuplicates, setSkipDuplicates] = useState(true);

    // UI state
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState('');
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        // Set the first list as default if available
        if (contactLists.length > 0 && !selectedListId) {
            setSelectedListId(contactLists[0]._id);
        }
    }, [contactLists, selectedListId]);

    const handleImport = async () => {
        if (!selectedListId) {
            setError('Please select a contact list');
            return;
        }

        try {
            setError('');
            setIsImporting(true);

            const res = await fetch(`/api/brands/${brandId}/integrations/airtable/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    listId: selectedListId,
                    emailField,
                    firstNameField,
                    lastNameField,
                    skipDuplicates,
                }),
                credentials: 'same-origin',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to import contacts');
            }

            setImportResult(data.results);

            // Call success callback after a short delay to allow the user to see the results
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(data.results);
                }, 2000);
            }
        } catch (error) {
            console.error('Error importing contacts:', error);
            setError(error.message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container import-modal">
                <div className="modal-header">
                    <h3>Import Contacts from Airtable</h3>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        disabled={isImporting}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-content">
                    {/* Connected Airtable Info */}
                    <div className="connected-airtable-info">
                        <div className="connection-info">
                            <div className="info-title">Connected Airtable:</div>
                            <div className="info-value">
                                <strong>Base ID:</strong> {integration.config.baseId}
                            </div>
                            <div className="info-value">
                                <strong>Table:</strong> {integration.config.tableName}
                            </div>
                        </div>
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="import-error">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Import Results */}
                    {importResult && (
                        <div className="import-result">
                            <div className="result-icon">
                                <Check size={32} />
                            </div>
                            <div className="result-details">
                                <h4>Import Complete!</h4>
                                <div className="result-stats">
                                    <div className="stat">
                                        <div className="stat-label">Total Records</div>
                                        <div className="stat-value">{importResult.total}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-label">Imported</div>
                                        <div className="stat-value">{importResult.imported}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-label">Duplicates</div>
                                        <div className="stat-value">{importResult.duplicates}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Form (shown if not currently showing results) */}
                    {!importResult && (
                        <div className="import-form">
                            <div className="form-group">
                                <label htmlFor="contact-list">Select Contact List</label>
                                <select
                                    id="contact-list"
                                    value={selectedListId}
                                    onChange={(e) => setSelectedListId(e.target.value)}
                                    disabled={isImporting}
                                >
                                    <option value="">Select a list...</option>
                                    {contactLists.map((list) => (
                                        <option
                                            key={list._id}
                                            value={list._id}
                                        >
                                            {list.name} ({list.contactCount || 0} contacts)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field-mapping-section">
                                <h4>Field Mapping</h4>
                                <p className="section-description">Specify which Airtable fields correspond to contact information:</p>

                                <div className="form-group">
                                    <label htmlFor="email-field">Email Field</label>
                                    <input
                                        type="text"
                                        id="email-field"
                                        value={emailField}
                                        onChange={(e) => setEmailField(e.target.value)}
                                        placeholder="Email"
                                        disabled={isImporting}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="first-name-field">First Name Field</label>
                                        <input
                                            type="text"
                                            id="first-name-field"
                                            value={firstNameField}
                                            onChange={(e) => setFirstNameField(e.target.value)}
                                            placeholder="First Name"
                                            disabled={isImporting}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="last-name-field">Last Name Field</label>
                                        <input
                                            type="text"
                                            id="last-name-field"
                                            value={lastNameField}
                                            onChange={(e) => setLastNameField(e.target.value)}
                                            placeholder="Last Name"
                                            disabled={isImporting}
                                        />
                                    </div>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={skipDuplicates}
                                            onChange={(e) => setSkipDuplicates(e.target.checked)}
                                            disabled={isImporting}
                                        />
                                        <span>Skip duplicate email addresses</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isImporting}
                        >
                            {importResult ? 'Close' : 'Cancel'}
                        </button>

                        {!importResult && (
                            <button
                                className="btn btn-primary"
                                onClick={handleImport}
                                disabled={isImporting || !selectedListId}
                            >
                                {isImporting ? (
                                    <>
                                        <RefreshCw
                                            size={16}
                                            className="spinner"
                                        />
                                        <span>Importing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>Import Contacts</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
