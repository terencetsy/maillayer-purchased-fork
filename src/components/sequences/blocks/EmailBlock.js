// src/components/sequences/blocks/EmailBlock.js
import { Mail, Clock, CheckCircle } from 'lucide-react';

export default function EmailBlock({ email, index, isSelected, onClick, totalEmails }) {
    const isConfigured = email.subject && email.content;

    return (
        <div
            className={`email-block ${isSelected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'}`}
            onClick={onClick}
        >
            <div className="email-block-header">
                <div className="email-block-icon">
                    <Mail size={18} />
                </div>
                <div className="email-block-content">
                    <div className="email-block-title">🎉 {email.subject || `Email ${index + 1}`}</div>
                    {isConfigured && (
                        <div className="email-block-badge">
                            <CheckCircle size={12} />
                            <span>Template configured</span>
                        </div>
                    )}
                </div>
                {isConfigured && (
                    <div className="email-block-status">
                        <div className="status-indicator">1</div>
                    </div>
                )}
            </div>

            <div className="email-block-delay">
                <Clock size={14} />
                <span>
                    Send after {email.delayAmount} {email.delayUnit}
                    {index > 0 ? ' from previous' : ''}
                </span>
            </div>

            <style jsx>{`
                .email-block {
                    width: 400px;
                    background: #fff;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .email-block:hover {
                    border-color: #ccc;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .email-block.selected {
                    border-color: #1a1a1a;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                }

                .email-block.unconfigured {
                    border-style: dashed;
                    background: #fafafa;
                }

                .email-block-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .email-block-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background: #f5f5f5;
                    border: 1px solid #e0e0e0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .email-block-content {
                    flex: 1;
                    min-width: 0;
                }

                .email-block-title {
                    font-size: 0.9375rem;
                    font-weight: 500;
                    color: #1a1a1a;
                    margin-bottom: 6px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .email-block-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 8px;
                    background: #e8f5e9;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    color: #2e7d32;
                }

                .email-block-status {
                    flex-shrink: 0;
                }

                .status-indicator {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #2196f3;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .email-block-delay {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: #f9f9f9;
                    border-radius: 6px;
                    font-size: 0.8125rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
}
