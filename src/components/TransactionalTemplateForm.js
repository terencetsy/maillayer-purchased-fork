import { useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';

export default function TransactionalTemplateForm({ brand, onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!formData.name || !formData.subject) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const response = await fetch(`/api/brands/${brand._id}/transactional`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create template');
            }

            const newTemplate = await response.json();
            onSuccess(newTemplate);
        } catch (error) {
            console.error('Error creating template:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>Create Transactional Template</h2>
                <button
                    className="close-btn"
                    onClick={onCancel}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="form-description">Create a new transactional email template that can be sent programmatically via API.</div>

            {error && (
                <div className="form-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="modern-form"
            >
                <div className="form-group">
                    <label htmlFor="name">
                        Template Name<span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="E.g., Welcome Email, Password Reset"
                            disabled={isSaving}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="subject">
                        Email Subject<span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Email subject line"
                            disabled={isSaving}
                        />
                    </div>
                    <div className="form-help">You can use variables like [firstName] in your subject line.</div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader
                                    size={16}
                                    className="spinner"
                                />
                                Creating...
                            </>
                        ) : (
                            'Create Template'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
