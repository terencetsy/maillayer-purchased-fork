// src/components/sequences/blocks/EmailBlock.js
import { Mail, Clock, CheckCircle } from 'lucide-react';

export default function EmailBlock({ email, index, isSelected, onClick, totalEmails }) {
    const isConfigured = email.subject && email.content;

    return (
        <div
            className={`email-block ${isSelected ? 'selected' : ''} ${isConfigured ? '' : 'unconfigured'}`}
            onClick={onClick}
        >
            <div className="email-step-number">{index + 1}</div>

            <div className="email-header">
                <div className="email-icon">
                    <Mail size={20} />
                </div>
                <div className="email-content">
                    <div className="email-label">Email {index + 1}</div>
                    {email.subject ? <h3 className="email-subject">{email.subject}</h3> : <div className="email-placeholder">Untitled Email</div>}
                </div>
                {isConfigured && (
                    <div className="email-status">
                        <CheckCircle size={12} />
                        Ready
                    </div>
                )}
            </div>

            <div className="email-meta">
                <div className="meta-item">
                    <Clock size={14} />
                    {email.delayAmount} {email.delayUnit}
                </div>
            </div>
        </div>
    );
}
