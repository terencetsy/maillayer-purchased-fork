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
        <div className="modern-form-container">
            <div className="form-header">
                <h2>Create a New Campaign</h2>
                <button
                    className="close-btn"
                    onClick={onCancel}
                    aria-label="Close form"
                >
                    <X size={18} />
                </button>
            </div>

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
                        Campaign Name<span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Fall Sale 2025"
                            disabled={isLoading}
                        />
                    </div>
                    <p className="input-help">Internal name to identify your campaign</p>
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
                            placeholder="Don't miss our fall sale! 20% off everything"
                            disabled={isLoading}
                        />
                    </div>
                    <p className="input-help">This will appear as the subject line of your email</p>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader
                                    size={16}
                                    className="spinner"
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
