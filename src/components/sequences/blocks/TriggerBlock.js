// src/components/sequences/blocks/TriggerBlock.js
import { List, Zap, AlertTriangle } from 'lucide-react';

export default function TriggerBlock({ sequence, isSelected, onClick }) {
    const getTriggerIcon = () => {
        switch (sequence.triggerType) {
            case 'contact_list':
                return <List size={20} />;
            case 'integration':
                return <Zap size={20} />;
            default:
                return <List size={20} />;
        }
    };

    const getTriggerLabel = () => {
        if (sequence.triggerType === 'contact_list' && sequence.triggerConfig?.contactListIds?.length > 0) {
            const count = sequence.triggerConfig.contactListIds.length;
            return `${count} List${count > 1 ? 's' : ''} Selected`;
        }
        if (sequence.triggerType === 'integration') {
            return sequence.triggerConfig?.integrationEvent || 'Integration Event';
        }
        return 'Not Configured';
    };

    const isConfigured = sequence.triggerType === 'contact_list' ? sequence.triggerConfig?.contactListIds?.length > 0 : false;

    return (
        <div
            className={`trigger-block ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="trigger-header">
                <div className="trigger-icon">{getTriggerIcon()}</div>
                <div className="trigger-content">
                    <div className="trigger-label">Trigger</div>
                    <h3 className="trigger-title">{getTriggerLabel()}</h3>
                </div>
            </div>

            {!isConfigured && (
                <div className="trigger-warning">
                    <AlertTriangle size={14} />
                    <span>Configure trigger to activate sequence</span>
                </div>
            )}
        </div>
    );
}
