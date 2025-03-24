import { useState } from 'react';

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

        // Validate form
        if (!formData.name || !formData.website) {
            setError('Please fill in all required fields');
            return;
        }

        // Simple website validation
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
        <div className="brand-form-container">
            <h2>Create a New Brand</h2>
            <p className="brand-form-description">Let's start by setting up your brand. You can configure email sending later.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Brand Name*</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="My Company"
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="website">Brand Website*</label>
                    <input
                        id="website"
                        name="website"
                        type="text"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="example.com"
                        disabled={isLoading}
                    />
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
                        {isLoading ? 'Creating...' : 'Create Brand'}
                    </button>
                </div>
            </form>
        </div>
    );
}
