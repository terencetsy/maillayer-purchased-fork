// src/components/sequences/sidebar/SequenceSettings.js
import { useState, useEffect } from 'react';
import { Mail, Save, AlertCircle } from 'lucide-react';

export default function SequenceSettings({ sequence, onUpdate }) {
    const [fromName, setFromName] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [replyToEmail, setReplyToEmail] = useState('');
    const [description, setDescription] = useState('');
    const [brand, setBrand] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // Initialize from sequence
        setFromName(sequence.emailConfig?.fromName || '');
        setFromEmail(sequence.emailConfig?.fromEmail || '');
        setReplyToEmail(sequence.emailConfig?.replyToEmail || '');
        setDescription(sequence.description || '');

        // Fetch brand details for defaults
        fetchBrandDetails();
    }, [sequence]);

    useEffect(() => {
        // Check if there are changes
        const changed = fromName !== (sequence.emailConfig?.fromName || '') || fromEmail !== (sequence.emailConfig?.fromEmail || '') || replyToEmail !== (sequence.emailConfig?.replyToEmail || '') || description !== (sequence.description || '');

        setHasChanges(changed);
    }, [fromName, fromEmail, replyToEmail, description, sequence]);

    const fetchBrandDetails = async () => {
        try {
            const response = await fetch(`/api/brands/${sequence.brandId}`, {
                credentials: 'same-origin',
            });
            if (response.ok) {
                const data = await response.json();
                setBrand(data);

                // Set defaults from brand if not already set
                if (!sequence.emailConfig?.fromName && data.fromName) {
                    setFromName(data.fromName);
                }
                if (!sequence.emailConfig?.fromEmail && data.fromEmail) {
                    setFromEmail(data.fromEmail);
                }
                if (!sequence.emailConfig?.replyToEmail && data.replyToEmail) {
                    setReplyToEmail(data.replyToEmail);
                }
            }
        } catch (error) {
            console.error('Error fetching brand:', error);
        }
    };

    const handleSave = () => {
        onUpdate({
            description,
            emailConfig: {
                fromName,
                fromEmail,
                replyToEmail,
            },
        });
        setHasChanges(false);
    };

    const handleUseBrandDefaults = () => {
        if (!brand) return;

        setFromName(brand.fromName || '');
        setFromEmail(brand.fromEmail || '');
        setReplyToEmail(brand.replyToEmail || '');
    };

    const isValidEmail = (email) => {
        return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const hasValidConfig = isValidEmail(fromEmail) && isValidEmail(replyToEmail);

    return (
        <div className="sequence-settings">
            <h2>Sequence Settings</h2>
            <p className="subtitle">Configure email sender information and sequence details</p>

            {/* Description */}
            <div className="form-section">
                <label className="form-label">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this sequence does..."
                    className="form-textarea"
                    rows={3}
                />
                <p className="helper-text">Optional description to help you remember the purpose of this sequence</p>
            </div>

            {/* Email Configuration */}
            <div className="form-section">
                <div className="section-title">
                    <Mail size={18} />
                    <h3>Email Configuration</h3>
                </div>

                {brand && (
                    <div className="brand-defaults-card">
                        <div className="brand-defaults-header">
                            <span className="brand-defaults-label">Brand Defaults</span>
                            <button
                                type="button"
                                className="text-button"
                                onClick={handleUseBrandDefaults}
                            >
                                Use defaults
                            </button>
                        </div>
                        <div className="brand-defaults-content">
                            <div className="default-item">
                                <span className="default-label">From:</span>
                                <span className="default-value">{brand.fromEmail || 'Not set'}</span>
                            </div>
                            <div className="default-item">
                                <span className="default-label">Reply-To:</span>
                                <span className="default-value">{brand.replyToEmail || 'Not set'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">
                        Sender Name<span className="form-required">*</span>
                    </label>
                    <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="Your Company"
                        className="form-input"
                    />
                    <p className="helper-text">The name recipients will see in their inbox</p>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        From Email<span className="form-required">*</span>
                    </label>
                    <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="noreply@example.com"
                        className="form-input"
                    />
                    {fromEmail && !isValidEmail(fromEmail) && (
                        <div className="field-error">
                            <AlertCircle size={14} />
                            <span>Please enter a valid email address</span>
                        </div>
                    )}
                    <p className="helper-text">Email address that will appear as the sender</p>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Reply-To Email<span className="form-required">*</span>
                    </label>
                    <input
                        type="email"
                        value={replyToEmail}
                        onChange={(e) => setReplyToEmail(e.target.value)}
                        placeholder="support@example.com"
                        className="form-input"
                    />
                    {replyToEmail && !isValidEmail(replyToEmail) && (
                        <div className="field-error">
                            <AlertCircle size={14} />
                            <span>Please enter a valid email address</span>
                        </div>
                    )}
                    <p className="helper-text">Where replies will be sent</p>
                </div>
            </div>

            {/* Save Button */}
            {hasChanges && (
                <div className="save-bar">
                    <p>You have unsaved changes</p>
                    <button
                        className="button button--primary"
                        onClick={handleSave}
                        disabled={!hasValidConfig}
                    >
                        <Save size={16} />
                        Save Settings
                    </button>
                </div>
            )}

            <style jsx>{`
                .sequence-settings {
                    padding-bottom: 80px;
                }

                .sequence-settings h2 {
                    margin: 0 0 8px 0;
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .subtitle {
                    margin: 0 0 24px 0;
                    font-size: 0.875rem;
                    color: #666;
                }

                .form-section {
                    margin-bottom: 32px;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .section-title h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .brand-defaults-card {
                    padding: 12px;
                    background: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }

                .brand-defaults-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .brand-defaults-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .text-button {
                    background: none;
                    border: none;
                    color: #2196f3;
                    font-size: 0.875rem;
                    cursor: pointer;
                    padding: 0;
                }

                .text-button:hover {
                    text-decoration: underline;
                }

                .brand-defaults-content {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .default-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.875rem;
                }

                .default-label {
                    color: #666;
                }

                .default-value {
                    color: #1a1a1a;
                    font-weight: 500;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1a1a1a;
                }

                .form-required {
                    color: #dc2626;
                    margin-left: 2px;
                }

                .form-input,
                .form-textarea {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 0.9375rem;
                    font-family: inherit;
                }

                .form-input:focus,
                .form-textarea:focus {
                    outline: none;
                    border-color: #1a1a1a;
                }

                .form-textarea {
                    resize: vertical;
                }

                .helper-text {
                    margin: 8px 0 0 0;
                    font-size: 0.8125rem;
                    color: #666;
                }

                .field-error {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 8px;
                    font-size: 0.8125rem;
                    color: #dc2626;
                }

                .save-bar {
                    position: fixed;
                    bottom: 0;
                    right: 0;
                    width: 400px;
                    padding: 16px 20px;
                    background: #fff;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
                    z-index: 10;
                }

                .save-bar p {
                    margin: 0;
                    font-size: 0.875rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
}
