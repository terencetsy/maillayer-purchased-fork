// src/components/sequences/SequenceSidebar.js - Update the handleToggleActive section
import { useState } from 'react';
import { ArrowLeft, Save, Play, Pause, Settings, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import TriggerConfig from './sidebar/TriggerConfig';
import EmailConfig from './sidebar/EmailConfig';
import SequenceSettings from './sidebar/SequenceSettings';

export default function SequenceSidebar({ sequence, onUpdate, selectedStep, setSelectedStep, onSave, onToggleActive, saving, hasUnsavedChanges, userObj }) {
    const [activationError, setActivationError] = useState('');

    const validateForActivation = () => {
        // Check trigger configuration
        if (sequence.triggerType === 'contact_list') {
            if (!sequence.triggerConfig?.contactListIds?.length) {
                return 'Please configure trigger lists before activating';
            }
        }

        // Check if at least one email exists
        if (!sequence.emails || sequence.emails.length === 0) {
            return 'Please add at least one email before activating';
        }

        // Check if all emails are configured
        const incompleteEmails = sequence.emails.filter((email) => !email.subject || !email.content);
        if (incompleteEmails.length > 0) {
            return `Please complete configuration for Email ${incompleteEmails[0].order}`;
        }

        return null;
    };

    const handleToggleClick = async () => {
        setActivationError('');

        // If activating, validate first
        if (sequence.status !== 'active') {
            const error = validateForActivation();
            if (error) {
                setActivationError(error);
                return;
            }
        }

        await onToggleActive();
    };

    const canActivate = sequence.status !== 'active' && !validateForActivation();

    const renderContent = () => {
        if (selectedStep === 'trigger') {
            return (
                <TriggerConfig
                    sequence={sequence}
                    onUpdate={onUpdate}
                />
            );
        }

        if (selectedStep === 'settings') {
            return (
                <SequenceSettings
                    sequence={sequence}
                    onUpdate={onUpdate}
                />
            );
        }

        // Find email by ID
        const email = sequence.emails?.find((e) => e.id === selectedStep);
        if (email) {
            return (
                <EmailConfig
                    sequence={sequence}
                    email={email}
                    onUpdate={onUpdate}
                />
            );
        }

        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                <p>Select a step to configure</p>
            </div>
        );
    };

    return (
        <div className="sequence-sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <Link
                    href={`/brands/${sequence.brandId}/sequences`}
                    className="back-link"
                >
                    <ArrowLeft size={16} />
                    Back
                </Link>

                <div className="sequence-info">
                    <h1>{sequence.name}</h1>
                    <div className="sequence-meta">
                        <span className={`status-badge status-${sequence.status}`}>{sequence.status === 'active' ? 'ACTIVE' : sequence.status.toUpperCase()}</span>
                        <span className="email-count">{sequence.emails?.length || 0} emails</span>
                    </div>
                </div>
            </div>

            {/* Email Configuration Section */}
            <div className="sidebar-section">
                <div className="section-header">
                    <h3>EMAIL CONFIGURATION</h3>
                    <button
                        className="text-button"
                        onClick={() => setSelectedStep('settings')}
                    >
                        Edit
                    </button>
                </div>
                <div className="email-config-display">
                    <div className="config-row">
                        <span className="config-label">From:</span>
                        <span className="config-value">{sequence.emailConfig?.fromEmail || 'Not set'}</span>
                    </div>
                    <div className="config-row">
                        <span className="config-label">Reply-To:</span>
                        <span className="config-value">{sequence.emailConfig?.replyToEmail || 'Not set'}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="sidebar-actions">
                <button
                    className="button button--secondary"
                    onClick={onSave}
                    disabled={saving || !hasUnsavedChanges}
                >
                    <Save size={16} />
                    {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                </button>
                <button
                    className={`button ${sequence.status === 'active' ? 'button--secondary' : 'button--primary'}`}
                    onClick={handleToggleClick}
                    disabled={sequence.status !== 'active' && !canActivate}
                    title={sequence.status !== 'active' && !canActivate ? validateForActivation() : ''}
                >
                    {sequence.status === 'active' ? (
                        <>
                            <Pause size={16} />
                            Pause
                        </>
                    ) : (
                        <>
                            <Play size={16} />
                            Activate
                        </>
                    )}
                </button>
            </div>

            {/* Activation Error */}
            {activationError && (
                <div className="activation-error">
                    <AlertCircle size={16} />
                    <span>{activationError}</span>
                </div>
            )}

            {/* Content */}
            <div className="sidebar-content">{renderContent()}</div>

            <style jsx>{`
                .sequence-sidebar {
                    width: 400px;
                    background: #fff;
                    border-left: 1px solid #e0e0e0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    overflow: hidden;
                }

                .sidebar-header {
                    padding: 20px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #666;
                    text-decoration: none;
                    font-size: 0.875rem;
                    margin-bottom: 16px;
                }

                .back-link:hover {
                    color: #1a1a1a;
                }

                .sequence-info h1 {
                    margin: 0 0 8px 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .sequence-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }

                .status-active {
                    background: #e8f5e9;
                    color: #2e7d32;
                }

                .status-paused {
                    background: #fff3e0;
                    color: #f57c00;
                }

                .status-draft {
                    background: #f5f5f5;
                    color: #666;
                }

                .email-count {
                    font-size: 0.875rem;
                    color: #666;
                }

                .sidebar-section {
                    padding: 20px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #666;
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

                .email-config-display {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .config-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.875rem;
                }

                .config-label {
                    color: #666;
                }

                .config-value {
                    color: #1a1a1a;
                    font-weight: 500;
                }

                .sidebar-actions {
                    padding: 20px;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    gap: 12px;
                }

                .sidebar-actions .button {
                    flex: 1;
                }

                .activation-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: #fff3e0;
                    border-bottom: 1px solid #f57c00;
                    color: #f57c00;
                    font-size: 0.875rem;
                }

                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }
            `}</style>
        </div>
    );
}
