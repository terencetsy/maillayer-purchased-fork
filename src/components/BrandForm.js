import { useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';

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
        <div className="brand-form-container">
            <div className="brand-form-header">
                <h3>Create your first brand</h3>
                <p>Set up your brand to start sending emails</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="name">Brand Name</label>
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

                <div className="form-group">
                    <label className="form-label" htmlFor="website">Website</label>
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
                    <p className="form-hint">Enter domain without http:// or https://</p>
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
                        className={`button button--primary ${isLoading ? 'btn-loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Brand'}
                    </button>
                </div>
            </form>
        </div>
    );
}
