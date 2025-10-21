import { useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';

export default function BrandForm({ onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        website: '',
    });

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

        if (!formData.name || !formData.website) {
            setError('Please fill in all required fields');
            return;
        }

        if (!formData.website.includes('.')) {
            setError('Please enter a valid website address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/brands', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create brand');
            }

            const brand = await response.json();

            if (onSuccess) {
                onSuccess(brand);
            }
        } catch (error) {
            console.error('Error creating brand:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={onCancel}
        >
            <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>Create Brand</h3>
                    <button
                        className="close-btn"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-content">
                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="modal-form"
                    >
                        <div className="form-group">
                            <label htmlFor="name">Brand Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="My Company"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <br />
                        <div className="form-group">
                            <label htmlFor="website">Website</label>
                            <input
                                id="website"
                                name="website"
                                type="text"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="example.com"
                                disabled={isLoading}
                                required
                            />
                            <p className="hint-text">Enter domain without http:// or https://</p>
                        </div>

                        <div className="modal-actions">
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
                                            className="spinner"
                                        />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Brand</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
