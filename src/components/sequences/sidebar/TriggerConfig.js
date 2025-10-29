// src/components/sequences/sidebar/TriggerConfig.js
import { useState, useEffect } from 'react';
import { List, Database, Zap, Check } from 'lucide-react';

export default function TriggerConfig({ sequence, onUpdate }) {
    const [contactLists, setContactLists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContactLists();
    }, []);

    const fetchContactLists = async () => {
        try {
            const response = await fetch(`/api/brands/${sequence.brandId}/contact-lists`, {
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

    const handleTriggerTypeChange = (type) => {
        onUpdate({
            triggerType: type,
            triggerConfig: {
                contactListIds: type === 'contact_list' ? [] : undefined,
            },
        });
    };

    const handleListToggle = (listId) => {
        const currentLists = sequence.triggerConfig?.contactListIds || [];
        const newLists = currentLists.includes(listId) ? currentLists.filter((id) => id !== listId) : [...currentLists, listId];

        onUpdate({
            triggerConfig: {
                ...sequence.triggerConfig,
                contactListIds: newLists,
            },
        });
    };

    return (
        <div className="trigger-config">
            <h2>Setup your sequence</h2>
            <p className="subtitle">Choose a data source and trigger event to get started</p>

            {/* Data Source */}
            <div className="form-section">
                <label className="form-label">Data source</label>
                <div className="trigger-type-options">
                    <button
                        className={`trigger-type-option ${sequence.triggerType === 'contact_list' ? 'selected' : ''}`}
                        onClick={() => handleTriggerTypeChange('contact_list')}
                    >
                        <List size={18} />
                        <span>Contact Lists</span>
                        {sequence.triggerType === 'contact_list' && (
                            <Check
                                size={16}
                                className="check-icon"
                            />
                        )}
                    </button>

                    <button
                        className={`trigger-type-option ${sequence.triggerType === 'integration' ? 'selected' : ''}`}
                        onClick={() => handleTriggerTypeChange('integration')}
                    >
                        <Zap size={18} />
                        <span>Integration</span>
                        {sequence.triggerType === 'integration' && (
                            <Check
                                size={16}
                                className="check-icon"
                            />
                        )}
                    </button>
                </div>
                {sequence.triggerType === 'contact_list' && <p className="helper-text">Selected: Contact Lists</p>}
            </div>

            {/* Contact List Selection */}
            {sequence.triggerType === 'contact_list' && (
                <div className="form-section">
                    <label className="form-label">Trigger Lists</label>
                    <p className="helper-text">Select which lists will trigger this sequence when contacts are added</p>

                    {loading ? (
                        <div className="loading-state">Loading contact lists...</div>
                    ) : contactLists.length === 0 ? (
                        <div className="empty-state">
                            <p>No contact lists found</p>
                        </div>
                    ) : (
                        <div className="list-options">
                            {contactLists.map((list) => {
                                const isSelected = sequence.triggerConfig?.contactListIds?.includes(list._id);
                                return (
                                    <label
                                        key={list._id}
                                        className={`list-option ${isSelected ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleListToggle(list._id)}
                                        />
                                        <div className="list-option-content">
                                            <div className="list-option-name">{list.name}</div>
                                            <div className="list-option-count">{list.contactCount || 0} contacts</div>
                                        </div>
                                        {isSelected && (
                                            <Check
                                                size={16}
                                                className="check-icon"
                                            />
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .trigger-config {
                    padding-bottom: 20px;
                }

                .trigger-config h2 {
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
                    margin-bottom: 24px;
                }

                .form-label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1a1a1a;
                }

                .helper-text {
                    margin: 8px 0 0 0;
                    font-size: 0.8125rem;
                    color: #666;
                }

                .trigger-type-options {
                    display: flex;
                    gap: 12px;
                }

                .trigger-type-option {
                    flex: 1;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                    font-weight: 500;
                    position: relative;
                }

                .trigger-type-option:hover {
                    border-color: #ccc;
                }

                .trigger-type-option.selected {
                    border-color: #1a1a1a;
                    background: #fafafa;
                }

                .check-icon {
                    position: absolute;
                    right: 8px;
                    color: #2e7d32;
                }

                .list-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .list-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }

                .list-option:hover {
                    border-color: #ccc;
                    background: #fafafa;
                }

                .list-option.selected {
                    border-color: #1a1a1a;
                    background: #f5f5f5;
                }

                .list-option input[type='checkbox'] {
                    cursor: pointer;
                }

                .list-option-content {
                    flex: 1;
                }

                .list-option-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1a1a1a;
                    margin-bottom: 2px;
                }

                .list-option-count {
                    font-size: 0.75rem;
                    color: #666;
                }

                .loading-state,
                .empty-state {
                    padding: 32px;
                    text-align: center;
                    color: #666;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}
