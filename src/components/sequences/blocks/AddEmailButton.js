// src/components/sequences/blocks/AddEmailButton.js
import { Plus } from 'lucide-react';

export default function AddEmailButton({ onClick }) {
    return (
        <button
            className="add-email-button"
            onClick={onClick}
        >
            <div className="add-email-icon">
                <Plus size={20} />
            </div>
            <span>Add email</span>

            <style jsx>{`
                .add-email-button {
                    width: 400px;
                    height: 80px;
                    background: #fff;
                    border: 2px dashed #e0e0e0;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #666;
                    font-size: 0.9375rem;
                    font-weight: 500;
                }

                .add-email-button:hover {
                    border-color: #1a1a1a;
                    background: #fafafa;
                    color: #1a1a1a;
                }

                .add-email-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #f5f5f5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .add-email-button:hover .add-email-icon {
                    background: #e0e0e0;
                }
            `}</style>
        </button>
    );
}
