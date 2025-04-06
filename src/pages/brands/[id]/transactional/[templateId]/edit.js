// src/pages/brands/[id]/transactional/[templateId]/edit.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Save, Eye, AlertCircle } from 'lucide-react';
import TransactionalTemplateForm from '@/components/TransactionalTemplateForm';

export default function EditTransactionalTemplate() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, templateId } = router.query;

    const [brand, setBrand] = useState(null);
    const [template, setTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && templateId) {
            fetchBrandDetails();
            fetchTemplateDetails();
        }
    }, [status, id, templateId, router]);

    const fetchBrandDetails = async () => {
        try {
            const res = await fetch(`/api/brands/${id}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Brand not found');
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch brand details');
                }
            }

            const data = await res.json();
            setBrand(data);
        } catch (error) {
            console.error('Error fetching brand details:', error);
            setError(error.message);
        }
    };

    const fetchTemplateDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Template not found');
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch template details');
                }
            }

            const data = await res.json();
            setTemplate(data);
        } catch (error) {
            console.error('Error fetching template details:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (formData) => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update template');
            }

            setSuccess('Template updated successfully');

            // Refresh template data
            fetchTemplateDetails();

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (error) {
            console.error('Error updating template:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !brand || !template) {
        return (
            <BrandLayout brand={brand}>
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>Loading template details...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="template-edit-container">
                <div className="edit-header">
                    <Link
                        href={`/brands/${id}/transactional/${templateId}`}
                        className="back-link"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Template Details</span>
                    </Link>
                    <h1>Edit Transactional Template</h1>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span>{success}</span>
                    </div>
                )}

                <TransactionalTemplateForm
                    brand={brand}
                    initialValues={template}
                    onSubmit={handleSubmit}
                    isSaving={isSaving}
                    isEditing={true}
                />
            </div>
        </BrandLayout>
    );
}
