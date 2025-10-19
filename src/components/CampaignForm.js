import { useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';

export default function CampaignForm({ brand, onCancel, onSuccess }) {
    const initialFormData = {
        name: '',
        subject: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/brands/${brand._id}/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create campaign');
            }

            const campaign = await response.json();

            if (onSuccess) {
                onSuccess(campaign);
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-form-container">
            <div className="modal-form-header">
                <h2>Create a New Campaign</h2>
                <button
                    className="modal-form-close"
                    onClick={onCancel}
                    aria-label="Close form"
                    type="button"
                >
                    <X size={20} />
                </button>
            </div>

            {error && (
                <div className="alert alert--error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="form"
            >
                <div className="form-group">
                    <label
                        htmlFor="name"
                        className="form-label"
                    >
                        Campaign Name<span className="form-required">*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Fall Sale 2025"
                        disabled={isLoading}
                        className="form-input"
                    />
                    <p className="form-help">Internal name to identify your campaign</p>
                </div>

                <div className="form-group">
                    <label
                        htmlFor="subject"
                        className="form-label"
                    >
                        Email Subject<span className="form-required">*</span>
                    </label>
                    <input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Don't miss our fall sale! 20% off everything"
                        disabled={isLoading}
                        className="form-input"
                    />
                    <p className="form-help">This will appear as the subject line of your email</p>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="button button--secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="button button--primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader
                                    size={16}
                                    className="spinner-icon"
                                />
                                Creating...
                            </>
                        ) : (
                            'Create Campaign'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
