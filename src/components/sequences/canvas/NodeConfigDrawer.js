// src/components/sequences/canvas/NodeConfigDrawer.js
import { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
import UnifiedEditor from '@/components/editor/UnifiedEditor';

export default function NodeConfigDrawer({ isOpen, nodeId, sequence, onUpdate, onClose, brandId }) {
    if (!isOpen || !nodeId) return null;

    const renderContent = () => {
        if (nodeId === 'trigger') {
            return <TriggerConfig sequence={sequence} onUpdate={onUpdate} brandId={brandId} />;
        }

        const email = sequence.emails?.find((e) => e.id === nodeId);
        if (email) {
            return <EmailConfig sequence={sequence} email={email} onUpdate={onUpdate} />;
        }

        return null;
    };

    const getTitle = () => {
        if (nodeId === 'trigger') return 'Configure Trigger';
        const email = sequence.emails?.find((e) => e.id === nodeId);
        if (email) return `Email ${email.order}`;
        return 'Configure';
    };

    return (
        <>
            <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>{getTitle()}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="drawer-body">{renderContent()}</div>
            </div>

            <style jsx>{`
                .overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 999;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s;
                }

                .overlay.open {
                    opacity: 1;
                    pointer-events: all;
                }

                .drawer {
                    position: fixed;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 480px;
                    max-width: 100vw;
                    background: #0a0a0a;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -4px 0 32px rgba(0, 0, 0, 0.5);
                    transform: translateX(100%);
                    transition: transform 0.2s ease;
                    border-left: 1px solid rgba(255,255,255,0.08);
                }

                .drawer.open {
                    transform: translateX(0);
                }

                .drawer-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    flex-shrink: 0;
                }

                .drawer-header h2 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #fafafa;
                }

                .close-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                    color: #71717a;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .close-btn:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fafafa;
                }

                .drawer-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }
            `}</style>
        </>
    );
}

function TriggerConfig({ sequence, onUpdate, brandId }) {
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

    return (
        <div className="config-form">
            <p className="description">
                When contacts are added to the selected lists, they will automatically enter this sequence.
            </p>

            <div className="form-section">
                <div className="section-header">
                    <label className="section-label">Contact Lists</label>
                    {selectedCount > 0 && <span className="count-badge">{selectedCount} selected</span>}
                </div>

                {loading ? (
                    <div className="loading-state">Loading lists...</div>
                ) : contactLists.length === 0 ? (
                    <div className="empty-state">No contact lists found</div>
                ) : (
                    <div className="list-grid">
                        {contactLists.map((list) => {
                            const isSelected = sequence.triggerConfig?.contactListIds?.includes(list._id);
                            return (
                                <label key={list._id} className={`list-item ${isSelected ? 'selected' : ''}`}>
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
                                    <div className="list-info">
                                        <span className="list-name">{list.name}</span>
                                        <span className="list-count">{list.contactCount || 0} contacts</span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx>{`
                .config-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .description {
                    margin: 0;
                    font-size: 13px;
                    color: #71717a;
                    line-height: 1.5;
                }

                .form-section {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .section-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: #a1a1aa;
                }

                .count-badge {
                    font-size: 11px;
                    font-weight: 500;
                    color: #818cf8;
                    background: rgba(99, 102, 241, 0.15);
                    padding: 3px 8px;
                    border-radius: 100px;
                }

                .loading-state,
                .empty-state {
                    padding: 32px;
                    text-align: center;
                    color: #52525b;
                    font-size: 13px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                }

                .list-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .list-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .list-item:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.12);
                }

                .list-item.selected {
                    background: rgba(99, 102, 241, 0.1);
                    border-color: rgba(99, 102, 241, 0.3);
                }

                .list-item input[type="checkbox"] {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }

                .checkbox {
                    width: 18px;
                    height: 18px;
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

                .list-item.selected .checkbox {
                    background: #6366f1;
                    border-color: #6366f1;
                    color: #fff;
                }

                .list-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    flex: 1;
                    min-width: 0;
                }

                .list-name {
                    font-size: 13px;
                    font-weight: 500;
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

function EmailConfig({ sequence, email, onUpdate }) {
    const [subject, setSubject] = useState(email.subject || '');
    const [content, setContent] = useState(email.content || '');
    const [delayAmount, setDelayAmount] = useState(email.delayAmount || 1);
    const [delayUnit, setDelayUnit] = useState(email.delayUnit || 'days');

    const updateTimeoutRef = useRef(null);

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

    return (
        <div className="config-form">
            <div className="delay-section">
                <div className="delay-icon">
                    <Clock size={16} />
                </div>
                <div className="delay-content">
                    <span className="delay-label">Send after</span>
                    <div className="delay-inputs">
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
            </div>

            <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    placeholder="Enter email subject..."
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Content</label>
                <div className="editor-wrapper">
                    <UnifiedEditor value={content} onChange={handleContentChange} />
                </div>
            </div>

            <style jsx>{`
                .config-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .delay-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                }

                .delay-icon {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    color: #71717a;
                }

                .delay-content {
                    flex: 1;
                }

                .delay-label {
                    display: block;
                    font-size: 12px;
                    color: #52525b;
                    margin-bottom: 6px;
                }

                .delay-inputs {
                    display: flex;
                    gap: 8px;
                }

                .delay-input {
                    width: 70px;
                    padding: 8px 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    font-size: 13px;
                    color: #fafafa;
                    background: rgba(255,255,255,0.05);
                    transition: all 0.15s;
                }

                .delay-input:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.08);
                }

                .delay-select {
                    padding: 8px 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    font-size: 13px;
                    color: #fafafa;
                    background: rgba(255,255,255,0.05);
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .delay-select:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.2);
                }

                .delay-select option {
                    background: #1c1c1c;
                    color: #fafafa;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: #a1a1aa;
                }

                .form-input {
                    padding: 10px 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    font-size: 14px;
                    color: #fafafa;
                    background: rgba(255,255,255,0.03);
                    transition: all 0.15s;
                }

                .form-input:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.05);
                }

                .form-input::placeholder {
                    color: #52525b;
                }

                .editor-wrapper {
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                    background: rgba(255,255,255,0.02);
                }
            `}</style>
        </div>
    );
}
