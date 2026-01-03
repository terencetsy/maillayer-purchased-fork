import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Save, Send, Loader } from 'lucide-react';
import UnifiedEditor from '@/components/editor/UnifiedEditor';

export default function CampaignEditor() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, campaignId } = router.query;

    const [brand, setBrand] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [content, setContent] = useState('');
    const [editorMode, setEditorMode] = useState('visual');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [lastSaved, setLastSaved] = useState(null);

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
            setEditorMode(data.editorMode || 'visual');
        } catch (error) {
            console.error('Error fetching campaign details:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContentChange = (newContent) => {
        setContent(newContent);
        setSaveMessage('');
    };

    const handleEditorModeChange = (newMode) => {
        setEditorMode(newMode);
        setSaveMessage('');
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveMessage('');
            setError('');

            const res = await fetch(`/api/brands/${id}/campaigns/${campaignId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                    editorMode: editorMode,
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to save campaign content');
            }

            setSaveMessage('Saved');
            setLastSaved(new Date());

            setTimeout(() => {
                setSaveMessage('');
            }, 2000);
        } catch (error) {
            console.error('Error saving campaign:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = () => {
        router.push(`/brands/${id}/campaigns/${campaignId}/send`);
    };

    if (isLoading || !brand || !campaign) {
        return (
            <BrandLayout brand={brand}>
                <div className="campaign-editor__loading">
                    <div className="spinner"></div>
                    <p>Loading campaign editor...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="campaign-editor campaign-editor--compact">
                {/* Compact Header Bar */}
                <div className="campaign-editor__header-bar">
                    <div className="campaign-editor__header-left">
                        <Link href={`/brands/${id}/campaigns`} className="campaign-editor__back">
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="campaign-editor__meta">
                            <h1 className="campaign-editor__title">{campaign.name}</h1>
                            <span className="campaign-editor__subject">{campaign.subject}</span>
                        </div>
                    </div>

                    <div className="campaign-editor__header-right">
                        {saveMessage && (
                            <span className="campaign-editor__save-status campaign-editor__save-status--success">
                                {saveMessage}
                            </span>
                        )}

                        {error && (
                            <span className="campaign-editor__save-status campaign-editor__save-status--error">
                                {error}
                            </span>
                        )}

                        <button
                            className="campaign-editor__btn campaign-editor__btn--secondary"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader size={16} className="spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>

                        {campaign.status === 'draft' && (
                            <button
                                className="campaign-editor__btn campaign-editor__btn--primary"
                                onClick={handleSend}
                            >
                                <Send size={16} />
                                <span>Send</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Editor Container - Full Focus */}
                <div className="campaign-editor__canvas">
                    <UnifiedEditor
                        value={content}
                        onChange={handleContentChange}
                        onModeChange={handleEditorModeChange}
                        placeholder="Start writing your email..."
                        editable={true}
                        defaultMode={editorMode}
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
