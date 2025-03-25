import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { ArrowLeft, Save } from 'lucide-react';

export default function CampaignEditor() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, campaignId } = router.query;

    const [brand, setBrand] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && campaignId) {
            fetchBrandDetails();
            fetchCampaignDetails();
        }
    }, [status, id, campaignId, router]);

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

    const fetchCampaignDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}/campaigns/${campaignId}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Campaign not found');
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch campaign details');
                }
            }

            const data = await res.json();
            setCampaign(data);
            setContent(data.content || getDefaultEmailTemplate());
        } catch (error) {
            console.error('Error fetching campaign details:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContentChange = (newContent) => {
        setContent(newContent);
        // Clear any previous save messages
        setSaveMessage('');
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveMessage('');

            const res = await fetch(`/api/brands/${id}/campaigns/${campaignId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to save campaign content');
            }

            setSaveMessage('Campaign saved successfully');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSaveMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error saving campaign:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !brand || !campaign) {
        return (
            <BrandLayout brand={brand}>
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>Loading campaign editor...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="campaign-editor-container">
                <div className="editor-header">
                    <div className="editor-header-left">
                        <Link
                            href={`/brands/${id}/campaigns/${campaignId}`}
                            className="back-link"
                        >
                            <ArrowLeft size={16} />
                            <span>Back to campaign</span>
                        </Link>
                        <h1>{campaign.name}</h1>
                        <div className="campaign-subject">
                            <span>Subject:</span> {campaign.subject}
                        </div>
                    </div>
                    <div className="editor-header-right">
                        {saveMessage && <div className="save-message">{saveMessage}</div>}
                        {error && <div className="save-error">{error}</div>}
                        <button
                            className="save-button"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="button-spinner"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="editor-main">
                    <RichTextEditor
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Write your email content or drag images here..."
                        editable={true}
                    />
                </div>
            </div>
        </BrandLayout>
    );
}

// Default email template with a standard email font
function getDefaultEmailTemplate() {
    return `
    <div style="font-family: Arial, sans-serif; color: #333333; max-width: 600px; margin: 0 auto;">
        <h2>Email Title</h2>
        <p>Hello,</p>
        <p>Edit this template to create your email content.</p>
        <p>Best regards,</p>
        <p>Your Name</p>
    </div>
    `;
}
