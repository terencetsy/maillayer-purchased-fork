// src/components/sequences/sidebar/EmailConfig.js
import { useState, useEffect } from 'react';
// import dynamic from 'next/dynamic';
import { Clock, Trash, Save } from 'lucide-react';
import UnifiedEditor from '@/components/editor/UnifiedEditor';

// const EmailEditor = dynamic(() => import('@/components/campaigns/EmailEditor'), { ssr: false });

export default function EmailConfig({ sequence, email, onUpdate }) {
    const [subject, setSubject] = useState(email.subject || '');
    const [content, setContent] = useState(email.content || '');
    const [delayAmount, setDelayAmount] = useState(email.delayAmount || 1);
    const [delayUnit, setDelayUnit] = useState(email.delayUnit || 'days');

    useEffect(() => {
        setSubject(email.subject || '');
        setContent(email.content || '');
        setDelayAmount(email.delayAmount || 1);
        setDelayUnit(email.delayUnit || 'days');
    }, [email]);

    const handleSave = () => {
        const updatedEmails = sequence.emails.map((e) => {
            if (e.id === email.id) {
                return {
                    ...e,
                    subject,
                    content,
                    delayAmount,
                    delayUnit,
                };
            }
            return e;
        });

        onUpdate({ emails: updatedEmails });
    };

    const handleDelete = () => {
        if (sequence.emails.length === 1) {
            alert('Cannot delete the last email. Sequence must have at least one email.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this email?')) {
            return;
        }

        const updatedEmails = sequence.emails
            .filter((e) => e.id !== email.id)
            .map((e, index) => ({
                ...e,
                order: index + 1,
            }));

        onUpdate({ emails: updatedEmails });
    };

    const hasChanges = subject !== email.subject || content !== email.content || delayAmount !== email.delayAmount || delayUnit !== email.delayUnit;

    return (
        <div className="email-config">
            <div className="email-config-header">
                <h2>Email {email.order}</h2>
                {sequence.emails.length > 1 && (
                    <button
                        className="delete-button"
                        onClick={handleDelete}
                    >
                        <Trash size={16} />
                        Delete
                    </button>
                )}
            </div>

            {/* Delay Configuration */}
            <div className="delay-config">
                <div className="delay-label">
                    <Clock size={16} />
                    <span>Send after</span>
                </div>
                <div className="delay-inputs">
                    <input
                        type="number"
                        min="0"
                        value={delayAmount}
                        onChange={(e) => setDelayAmount(parseInt(e.target.value) || 0)}
                        className="delay-amount-input"
                    />
                    <select
                        value={delayUnit}
                        onChange={(e) => setDelayUnit(e.target.value)}
                        className="delay-unit-select"
                    >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                    </select>
                </div>
                {email.order > 1 && <p className="delay-note">Delay starts after the previous email is sent</p>}
            </div>

            {/* Subject */}
            <div className="form-group">
                <label className="form-label">
                    Subject Line<span className="form-required">*</span>
                </label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Welcome to our community! 🎉"
                    className="form-input"
                />
            </div>

            {/* Email Content */}
            <div className="form-group">
                <label className="form-label">
                    Email Content<span className="form-required">*</span>
                </label>
                <UnifiedEditor
                    content={content}
                    onChange={setContent}
                />
            </div>

            {/* Save Button */}
            {hasChanges && (
                <div className="save-bar">
                    <p>You have unsaved changes</p>
                    <button
                        className="button button--primary"
                        onClick={handleSave}
                    >
                        <Save size={16} />
                        Save Email
                    </button>
                </div>
            )}

            <style jsx>{`
                .email-config {
                    padding-bottom: 80px;
                }

                .email-config-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .email-config-header h2 {
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .delete-button {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: none;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    color: #dc2626;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .delete-button:hover {
                    background: #ffebee;
                    border-color: #dc2626;
                }

                .delay-config {
                    padding: 16px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                .delay-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #666;
                    margin-bottom: 12px;
                }

                .delay-inputs {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .delay-amount-input,
                .delay-unit-select {
                    padding: 10px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 0.9375rem;
                    background: #fff;
                }

                .delay-note {
                    margin: 12px 0 0 0;
                    font-size: 0.8125rem;
                    color: #666;
                }

                .form-group {
                    margin-bottom: 24px;
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

                .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 0.9375rem;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #1a1a1a;
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
