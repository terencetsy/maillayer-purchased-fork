// src/components/sequences/blocks/AddEmailButton.js
import { Plus } from 'lucide-react';

export default function AddEmailButton({ onClick }) {
    return (
        <div
            className="add-email-block"
            onClick={onClick}
        >
            <div className="add-email-content">
                <div className="add-icon">
                    <Plus size={20} />
                </div>
                <span>Add Email</span>
            </div>
        </div>
    );
}
