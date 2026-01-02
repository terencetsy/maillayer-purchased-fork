// src/components/sequences/canvas/NodeDetailPanel.js
import { useState, useEffect, useRef } from 'react';
import { Users, Mail, Clock, AlertCircle, Check } from 'lucide-react';
import UnifiedEditor from '@/components/editor/UnifiedEditor';

export default function NodeDetailPanel({ nodeId, sequence, onUpdate, brandId }) {
    if (!nodeId) return null;

    if (nodeId === 'trigger') {
        return <TriggerPanel sequence={sequence} onUpdate={onUpdate} brandId={brandId} />;
    }

    const email = sequence.emails?.find((e) => e.id === nodeId);
    if (email) {
        return <EmailPanel sequence={sequence} email={email} onUpdate={onUpdate} />;
    }

    return null;
}

function TriggerPanel({ sequence, onUpdate, brandId }) {
    const [contactLists, setContactLists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContactLists();
    }, []);

    const fetchContactLists = async () => {
        try {
            const response = await fetch(`/api/brands/${brandId}/contact-lists`, {
                credentials: 'same-origin',
            });
            if (response.ok) {
                const data = await response.json();
                setContactLists(data);
            }
        } catch (error) {
            console.error('Error fetching contact lists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleListToggle = (listId) => {
        const currentLists = sequence.triggerConfig?.contactListIds || [];
        const newLists = currentLists.includes(listId)
            ? currentLists.filter((id) => id !== listId)
            : [...currentLists, listId];

        onUpdate({
            triggerConfig: {
                ...sequence.triggerConfig,
                contactListIds: newLists,
            },
        });
    };

    const selectedCount = sequence.triggerConfig?.contactListIds?.length || 0;
    const isConfigured = selectedCount > 0;

    return (
        <div className="detail-panel">
            <div className="panel-header">
                <div className="panel-icon trigger">
                    <Users size={18} />
                </div>
                <div className="panel-title">
                    <h2>Trigger</h2>
                    <p>Configure when contacts enter this sequence</p>
                </div>
                <div className={`panel-status ${isConfigured ? 'configured' : 'warning'}`}>
                    {isConfigured ? <Check size={14} /> : <AlertCircle size={14} />}
                </div>
            </div>

            <div className="panel-body">
                <div className="section">
                    <div className="section-header">
                        <span className="section-label">Contact Lists</span>
                        {selectedCount > 0 && (
                            <span className="count-badge">{selectedCount} selected</span>
                        )}
                    </div>
                    <p className="section-desc">
                        Contacts will enter this sequence when added to selected lists.
                    </p>

                    {loading ? (
                        <div className="loading-box">Loading lists...</div>
                    ) : contactLists.length === 0 ? (
                        <div className="empty-box">No contact lists found</div>
                    ) : (
                        <div className="list-options">
                            {contactLists.map((list) => {
                                const isSelected = sequence.triggerConfig?.contactListIds?.includes(list._id);
                                return (
                                    <label key={list._id} className={`list-option ${isSelected ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleListToggle(list._id)}
                                        />
                                        <span className="checkbox">
                                            <svg viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </span>
                                        <span className="list-name">{list.name}</span>
                                        <span className="list-count">{list.contactCount || 0}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .detail-panel {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .panel-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }

                .panel-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .panel-icon.trigger {
                    background: rgba(99, 102, 241, 0.15);
                    color: #818cf8;
                }

                .panel-title {
                    flex: 1;
                }

                .panel-title h2 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #fafafa;
                }

                .panel-title p {
                    margin: 4px 0 0;
                    font-size: 12px;
                    color: #52525b;
                }

                .panel-status {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .panel-status.configured {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                }

                .panel-status.warning {
                    background: rgba(245, 158, 11, 0.15);
                    color: #f59e0b;
                }

                .panel-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .section {
                    margin-bottom: 24px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }

                .section-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #a1a1aa;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .count-badge {
                    font-size: 11px;
                    font-weight: 500;
                    color: #818cf8;
                    background: rgba(99, 102, 241, 0.15);
                    padding: 2px 8px;
                    border-radius: 100px;
                }

                .section-desc {
                    margin: 0 0 12px;
                    font-size: 13px;
                    color: #52525b;
                    line-height: 1.4;
                }

                .loading-box,
                .empty-box {
                    padding: 24px;
                    text-align: center;
                    color: #52525b;
                    font-size: 13px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                }

                .list-options {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .list-option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .list-option:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.1);
                }

                .list-option.selected {
                    background: rgba(99, 102, 241, 0.08);
                    border-color: rgba(99, 102, 241, 0.25);
                }

                .list-option input {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }

                .checkbox {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.15s;
                    color: transparent;
                }

                .checkbox svg {
                    width: 10px;
                    height: 10px;
                }

                .list-option.selected .checkbox {
                    background: #6366f1;
                    border-color: #6366f1;
                    color: #fff;
                }

                .list-name {
                    flex: 1;
                    font-size: 13px;
                    color: #fafafa;
                }

                .list-count {
                    font-size: 12px;
                    color: #52525b;
                }
            `}</style>
        </div>
    );
}

function EmailPanel({ sequence, email, onUpdate }) {
    const [subject, setSubject] = useState(email.subject || '');
    const [content, setContent] = useState(email.content || '');
    const [delayAmount, setDelayAmount] = useState(email.delayAmount || 1);
    const [delayUnit, setDelayUnit] = useState(email.delayUnit || 'days');

    const updateTimeoutRef = useRef(null);

    // Sync state when email changes
    useEffect(() => {
        setSubject(email.subject || '');
        setContent(email.content || '');
        setDelayAmount(email.delayAmount || 1);
        setDelayUnit(email.delayUnit || 'days');
    }, [email.id]);

    const debouncedUpdate = (updates) => {
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
            handleSave(updates);
        }, 500);
    };

    const handleSubjectChange = (newSubject) => {
        setSubject(newSubject);
        debouncedUpdate({ subject: newSubject, content, delayAmount, delayUnit });
    };

    const handleContentChange = (newContent) => {
        setContent(newContent);
        debouncedUpdate({ subject, content: newContent, delayAmount, delayUnit });
    };

    const handleDelayChange = (newAmount, newUnit) => {
        const amount = newAmount !== undefined ? newAmount : delayAmount;
        const unit = newUnit !== undefined ? newUnit : delayUnit;
        setDelayAmount(amount);
        if (newUnit !== undefined) setDelayUnit(unit);
        debouncedUpdate({ subject, content, delayAmount: amount, delayUnit: unit });
    };

    const handleSave = (updates = {}) => {
        const updatesToUse = {
            subject: updates.subject !== undefined ? updates.subject : subject,
            content: updates.content !== undefined ? updates.content : content,
            delayAmount: updates.delayAmount !== undefined ? Number(updates.delayAmount) : Number(delayAmount),
            delayUnit: updates.delayUnit !== undefined ? updates.delayUnit : delayUnit,
        };

        const updatedEmails = sequence.emails.map((e) => {
            if (e.id === email.id) {
                return { ...e, ...updatesToUse };
            }
            return e;
        });

        onUpdate({ emails: updatedEmails });
    };

    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    const isConfigured = email.subject && email.content;

    return (
        <div className="detail-panel">
            <div className="panel-header">
                <div className="panel-icon email">
                    <Mail size={18} />
                </div>
                <div className="panel-title">
                    <h2>Email {email.order}</h2>
                    <p>{email.subject || 'No subject'}</p>
                </div>
                <div className={`panel-status ${isConfigured ? 'configured' : 'warning'}`}>
                    {isConfigured ? <Check size={14} /> : <AlertCircle size={14} />}
                </div>
            </div>

            <div className="panel-body">
                {/* Delay */}
                <div className="section">
                    <span className="section-label">Timing</span>
                    <div className="delay-row">
                        <div className="delay-icon">
                            <Clock size={14} />
                        </div>
                        <span className="delay-text">Send after</span>
                        <input
                            type="number"
                            min="0"
                            value={delayAmount}
                            onChange={(e) => handleDelayChange(parseInt(e.target.value) || 0)}
                            className="delay-input"
                        />
                        <select
                            value={delayUnit}
                            onChange={(e) => handleDelayChange(undefined, e.target.value)}
                            className="delay-select"
                        >
                            <option value="minutes">minutes</option>
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                        </select>
                    </div>
                </div>

                {/* Subject */}
                <div className="section">
                    <label className="section-label">Subject Line</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Enter email subject..."
                        className="text-input"
                    />
                </div>

                {/* Content */}
                <div className="section section-grow">
                    <label className="section-label">Email Content</label>
                    <div className="editor-box">
                        <UnifiedEditor value={content} onChange={handleContentChange} />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .detail-panel {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .panel-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }

                .panel-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .panel-icon.email {
                    background: rgba(236, 72, 153, 0.15);
                    color: #f472b6;
                }

                .panel-title {
                    flex: 1;
                    min-width: 0;
                }

                .panel-title h2 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #fafafa;
                }

                .panel-title p {
                    margin: 4px 0 0;
                    font-size: 12px;
                    color: #52525b;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .panel-status {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .panel-status.configured {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                }

                .panel-status.warning {
                    background: rgba(245, 158, 11, 0.15);
                    color: #f59e0b;
                }

                .panel-body {
                    flex: 1;
                    overflow: hidden;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }

                .section {
                    margin-bottom: 20px;
                }

                .section-grow {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 200px;
                }

                .section-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: #a1a1aa;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                }

                .delay-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 8px;
                }

                .delay-icon {
                    color: #52525b;
                }

                .delay-text {
                    font-size: 13px;
                    color: #71717a;
                }

                .delay-input {
                    width: 60px;
                    padding: 6px 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    font-size: 13px;
                    color: #fafafa;
                    background: rgba(255,255,255,0.05);
                }

                .delay-input:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.2);
                }

                .delay-select {
                    padding: 6px 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    font-size: 13px;
                    color: #fafafa;
                    background: rgba(255,255,255,0.05);
                    cursor: pointer;
                }

                .delay-select:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.2);
                }

                .delay-select option {
                    background: #1c1c1c;
                    color: #fafafa;
                }

                .text-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    font-size: 14px;
                    color: #fafafa;
                    background: rgba(255,255,255,0.02);
                    transition: all 0.15s;
                }

                .text-input:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.15);
                    background: rgba(255,255,255,0.04);
                }

                .text-input::placeholder {
                    color: #52525b;
                }

                .editor-box {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    overflow: hidden;
                    background: rgba(255,255,255,0.02);
                    min-height: 450px;
                }
            `}</style>
        </div>
    );
}
