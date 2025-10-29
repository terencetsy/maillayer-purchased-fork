// src/components/sequences/blocks/TriggerBlock.js
import { Database, List, Zap, Settings } from 'lucide-react';

export default function TriggerBlock({ sequence, isSelected, onClick }) {
    const getTriggerIcon = () => {
        switch (sequence.triggerType) {
            case 'contact_list':
                return <List size={20} />;
            case 'integration':
                return <Zap size={20} />;
            default:
                return <Database size={20} />;
        }
    };

    const getTriggerLabel = () => {
        if (sequence.triggerType === 'contact_list' && sequence.triggerConfig?.contactListIds?.length > 0) {
            return `${sequence.triggerConfig.contactListIds.length} Contact List${sequence.triggerConfig.contactListIds.length > 1 ? 's' : ''}`;
        }
        if (sequence.triggerType === 'integration') {
            return sequence.triggerConfig?.integrationEvent || 'Integration Event';
        }
        return 'Configure Trigger';
    };

    return (
        <div
            className={`trigger-block ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="trigger-block-header">
                <div className="trigger-block-icon">{getTriggerIcon()}</div>
                <div className="trigger-block-content">
                    <div className="trigger-block-title">Trigger</div>
                    <div className="trigger-block-subtitle">{getTriggerLabel()}</div>
                </div>
            </div>

            {!sequence.triggerConfig?.contactListIds?.length && sequence.triggerType === 'contact_list' && (
                <div className="trigger-block-warning">
                    <Settings size={14} />
                    <span>Setup required</span>
                </div>
            )}

            <style jsx>{`
                .trigger-block {
                    width: 400px;
                    background: #fff9e6;
                    border: 2px solid #f4e4a6;
                    border-radius: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .trigger-block:hover {
                    border-color: #e6d68a;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .trigger-block.selected {
                    border-color: #1a1a1a;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                }

                .trigger-block-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .trigger-block-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background: #fff;
                    border: 1px solid #f4e4a6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .trigger-block-content {
                    flex: 1;
                    min-width: 0;
                }

                .trigger-block-title {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 4px;
                }

                .trigger-block-subtitle {
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: #1a1a1a;
                }

                .trigger-block-warning {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 12px;
                    padding: 8px 12px;
                    background: #fff;
                    border-radius: 6px;
                    font-size: 0.8125rem;
                    color: #f57c00;
                }
            `}</style>
        </div>
    );
}
