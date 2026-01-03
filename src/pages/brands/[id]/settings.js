import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { Settings, Save, Globe, Mail, Shield, Trash, AlertCircle, CheckCircle, Loader, Sliders, Webhook, Copy, ExternalLink, ChevronRight, Users, UserPlus, Trash2, X, Check } from 'lucide-react';
import { AWS_SES_REGIONS } from '@/constants/awsRegions';

export default function BrandSettings() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [brand, setBrand] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [activeTab, setActiveTab] = useState('general');

    // General settings
    const [name, setName] = useState('');
    const [website, setWebsite] = useState('');

    // Sending settings
    const [fromName, setFromName] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [replyToEmail, setReplyToEmail] = useState('');

    // Email Provider settings
    const [emailProvider, setEmailProvider] = useState('ses');
    const [emailProviderConnectionType, setEmailProviderConnectionType] = useState('api');

    // AWS SES settings
    const [awsRegion, setAwsRegion] = useState('');
    const [awsAccessKey, setAwsAccessKey] = useState('');
    const [awsSecretKey, setAwsSecretKey] = useState('');

    // SendGrid settings
    const [sendgridApiKey, setSendgridApiKey] = useState('');

    // Mailgun settings
    const [mailgunApiKey, setMailgunApiKey] = useState('');
    const [mailgunDomain, setMailgunDomain] = useState('');
    const [mailgunRegion, setMailgunRegion] = useState('us');

    // Delete brand
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Webhook copy state
    const [copiedWebhook, setCopiedWebhook] = useState(false);

    // Team state
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const getWebhookBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return '';
    };

    const copyWebhookUrl = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 2000);
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id) {
            fetchBrandDetails();
        }
    }, [status, id, router]);

    useEffect(() => {
        if (activeTab === 'team' && id && brand?.userRole === 'owner') {
            fetchTeamMembers();
        }
    }, [activeTab, id, brand?.userRole]);

    const fetchTeamMembers = async () => {
        setIsLoadingTeam(true);
        try {
            const res = await fetch(`/api/brands/${id}/team`, { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setIsLoadingTeam(false);
        }
    };

    useEffect(() => {
        if (brand) {
            setName(brand.name || '');
            setWebsite(brand.website || '');
            setFromName(brand.fromName || '');
            setFromEmail(brand.fromEmail || '');
            setReplyToEmail(brand.replyToEmail || '');
            setEmailProvider(brand.emailProvider || 'ses');
            setEmailProviderConnectionType(brand.emailProviderConnectionType || 'api');
            setAwsRegion(brand.awsRegion || '');
            setAwsAccessKey(brand.awsAccessKey || '');
            setAwsSecretKey(brand.awsSecretKey ? '••••••••••••••••' : '');
            setSendgridApiKey(brand.sendgridApiKey ? '••••••••••••••••' : '');
            setMailgunApiKey(brand.mailgunApiKey ? '••••••••••••••••' : '');
            setMailgunDomain(brand.mailgunDomain || '');
            setMailgunRegion(brand.mailgunRegion || 'us');
        }
    }, [brand]);

    const fetchBrandDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}?includeSecrets=true`, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('Failed to fetch brand details');
            const data = await res.json();
            setBrand(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formType = e.target.getAttribute('data-form-type');

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            let updateData = {};

            switch (formType) {
                case 'general':
                    if (!name || !website) throw new Error('Name and website are required');
                    updateData = { name, website };
                    break;
                case 'sending':
                    updateData = { fromName, fromEmail, replyToEmail };
                    break;
                case 'provider':
                    updateData = {
                        emailProvider,
                        emailProviderConnectionType,
                    };
                    if (emailProvider === 'ses') {
                        updateData.awsRegion = awsRegion;
                        updateData.awsAccessKey = awsAccessKey;
                        if (awsSecretKey !== '••••••••••••••••') {
                            updateData.awsSecretKey = awsSecretKey;
                        }
                    } else if (emailProvider === 'sendgrid') {
                        if (sendgridApiKey !== '••••••••••••••••') {
                            updateData.sendgridApiKey = sendgridApiKey;
                        }
                    } else if (emailProvider === 'mailgun') {
                        updateData.mailgunDomain = mailgunDomain;
                        updateData.mailgunRegion = mailgunRegion;
                        if (mailgunApiKey !== '••••••••••••••••') {
                            updateData.mailgunApiKey = mailgunApiKey;
                        }
                    }
                    break;
                default:
                    throw new Error('Unknown form type');
            }

            const res = await fetch(`/api/brands/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
                credentials: 'same-origin',
            });

            if (!res.ok) throw new Error('Failed to update settings');

            setSuccess('Settings saved successfully');
            fetchBrandDetails();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBrand = async () => {
        if (deleteConfirmText !== brand.name) {
            setError('Enter brand name to confirm');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/brands/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });

            if (!res.ok) throw new Error('Failed to delete brand');
            router.push('/brands');
        } catch (error) {
            setError(error.message);
            setIsSaving(false);
        }
    };

    // Filter tabs based on user role - only owners can see Team and Danger Zone
    const isOwner = brand?.userRole === 'owner';

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'sending', label: 'Sending', icon: Mail },
        { id: 'provider', label: 'Email Provider', icon: Sliders },
        ...(isOwner ? [{ id: 'team', label: 'Team', icon: Users }] : []),
        ...(isOwner ? [{ id: 'advanced', label: 'Danger Zone', icon: Trash }] : []),
    ];

    const renderSettingsTab = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <form onSubmit={handleSubmit} data-form-type="general">
                        <div className="form-section">
                            <div className="form-row">
                                <label>Brand Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Brand"
                                    disabled={isSaving}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <label>Website</label>
                                <input
                                    type="text"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="example.com"
                                    disabled={isSaving}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-footer">
                            <button type="submit" className="save-btn" disabled={isSaving}>
                                {isSaving ? <Loader size={14} className="spin" /> : <Save size={14} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                );

            case 'sending':
                return (
                    <form onSubmit={handleSubmit} data-form-type="sending">
                        {brand?.status !== 'active' && (
                            <div className="info-banner warning">
                                <Shield size={14} />
                                <span>Domain verification required to send emails</span>
                                <Link href={`/brands/${id}/verification`} className="banner-link">
                                    Verify Domain <ChevronRight size={12} />
                                </Link>
                            </div>
                        )}

                        <div className="form-section">
                            <div className="form-row">
                                <label>Sender Name</label>
                                <input
                                    type="text"
                                    value={fromName}
                                    onChange={(e) => setFromName(e.target.value)}
                                    placeholder="Your Company"
                                    disabled={isSaving}
                                />
                                <span className="hint">The name recipients will see</span>
                            </div>

                            <div className="form-row">
                                <label>Sender Email</label>
                                <input
                                    type="email"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                    placeholder="noreply@example.com"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="form-row">
                                <label>Reply-To Email</label>
                                <input
                                    type="email"
                                    value={replyToEmail}
                                    onChange={(e) => setReplyToEmail(e.target.value)}
                                    placeholder="support@example.com"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        <div className="form-footer">
                            <button type="submit" className="save-btn" disabled={isSaving}>
                                {isSaving ? <Loader size={14} className="spin" /> : <Save size={14} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                );

            case 'provider':
                return (
                    <form onSubmit={handleSubmit} data-form-type="provider">
                        <div className="form-section">
                            <div className="form-row">
                                <label>Email Provider</label>
                                <select
                                    value={emailProvider}
                                    onChange={(e) => setEmailProvider(e.target.value)}
                                    disabled={isSaving}
                                >
                                    <option value="ses">Amazon SES</option>
                                    <option value="sendgrid">SendGrid</option>
                                    <option value="mailgun">Mailgun</option>
                                </select>
                            </div>

                            {(emailProvider === 'sendgrid' || emailProvider === 'mailgun') && (
                                <div className="form-row">
                                    <label>Connection Type</label>
                                    <select
                                        value={emailProviderConnectionType}
                                        onChange={(e) => setEmailProviderConnectionType(e.target.value)}
                                        disabled={isSaving}
                                    >
                                        <option value="api">API (Recommended)</option>
                                        <option value="smtp">SMTP</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* AWS SES Settings */}
                        {emailProvider === 'ses' && (
                            <div className="form-section">
                                <h4 className="section-title">AWS SES Credentials</h4>
                                <div className="form-row">
                                    <label>AWS Region</label>
                                    <select
                                        value={awsRegion}
                                        onChange={(e) => setAwsRegion(e.target.value)}
                                        disabled={isSaving}
                                    >
                                        <option value="">Select region</option>
                                        {AWS_SES_REGIONS.map((region) => (
                                            <option key={region.value} value={region.value}>
                                                {region.label} ({region.value})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <label>Access Key ID</label>
                                    <input
                                        type="text"
                                        value={awsAccessKey}
                                        onChange={(e) => setAwsAccessKey(e.target.value)}
                                        placeholder="AKIAIOSFODNN7EXAMPLE"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="form-row">
                                    <label>Secret Access Key</label>
                                    <input
                                        type="password"
                                        value={awsSecretKey}
                                        onChange={(e) => setAwsSecretKey(e.target.value)}
                                        placeholder="Enter new key or leave unchanged"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        )}

                        {/* SendGrid Settings */}
                        {emailProvider === 'sendgrid' && (
                            <div className="form-section">
                                <h4 className="section-title">SendGrid Credentials</h4>
                                <div className="form-row">
                                    <label>API Key</label>
                                    <input
                                        type="password"
                                        value={sendgridApiKey}
                                        onChange={(e) => setSendgridApiKey(e.target.value)}
                                        placeholder="Enter API key or leave unchanged"
                                        disabled={isSaving}
                                    />
                                    <span className="hint">
                                        Get your API key from{' '}
                                        <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer">
                                            SendGrid Dashboard <ExternalLink size={10} />
                                        </a>
                                    </span>
                                </div>

                                <WebhookSetup
                                    provider="sendgrid"
                                    webhookUrl={`${getWebhookBaseUrl()}/api/webhooks/sendgrid`}
                                    onCopy={copyWebhookUrl}
                                    copied={copiedWebhook}
                                />
                            </div>
                        )}

                        {/* Mailgun Settings */}
                        {emailProvider === 'mailgun' && (
                            <div className="form-section">
                                <h4 className="section-title">Mailgun Credentials</h4>
                                <div className="form-row">
                                    <label>API Key</label>
                                    <input
                                        type="password"
                                        value={mailgunApiKey}
                                        onChange={(e) => setMailgunApiKey(e.target.value)}
                                        placeholder="Enter API key or leave unchanged"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-row">
                                        <label>Domain</label>
                                        <input
                                            type="text"
                                            value={mailgunDomain}
                                            onChange={(e) => setMailgunDomain(e.target.value)}
                                            placeholder="mg.yourdomain.com"
                                            disabled={isSaving}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <label>Region</label>
                                        <select
                                            value={mailgunRegion}
                                            onChange={(e) => setMailgunRegion(e.target.value)}
                                            disabled={isSaving}
                                        >
                                            <option value="us">US</option>
                                            <option value="eu">EU</option>
                                        </select>
                                    </div>
                                </div>

                                <span className="hint">
                                    Get your API key from{' '}
                                    <a href="https://app.mailgun.com/settings/api_security" target="_blank" rel="noopener noreferrer">
                                        Mailgun Dashboard <ExternalLink size={10} />
                                    </a>
                                </span>

                                <WebhookSetup
                                    provider="mailgun"
                                    webhookUrl={`${getWebhookBaseUrl()}/api/webhooks/mailgun`}
                                    onCopy={copyWebhookUrl}
                                    copied={copiedWebhook}
                                    domain={mailgunDomain}
                                />
                            </div>
                        )}

                        <div className="form-footer">
                            <button type="submit" className="save-btn" disabled={isSaving}>
                                {isSaving ? <Loader size={14} className="spin" /> : <Save size={14} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                );

            case 'team':
                return (
                    <TeamTab
                        brandId={id}
                        teamMembers={teamMembers}
                        isLoading={isLoadingTeam}
                        onRefresh={fetchTeamMembers}
                        onInvite={() => setShowInviteModal(true)}
                    />
                );

            case 'advanced':
                return (
                    <div className="danger-section">
                        <div className="danger-card">
                            <div className="danger-header">
                                <Trash size={16} />
                                <h4>Delete Brand</h4>
                            </div>
                            <p>Permanently delete this brand and all associated data including campaigns, contacts, and sequences. This action cannot be undone.</p>

                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    className="delete-btn"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash size={14} />
                                    Delete Brand
                                </button>
                            ) : (
                                <div className="delete-confirm">
                                    <p>Type <strong>{brand.name}</strong> to confirm:</p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        disabled={isSaving}
                                        placeholder="Brand name"
                                    />
                                    <div className="delete-actions">
                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }}
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="confirm-delete-btn"
                                            onClick={handleDeleteBrand}
                                            disabled={isSaving || deleteConfirmText !== brand.name}
                                        >
                                            {isSaving ? <Loader size={14} className="spin" /> : <Trash size={14} />}
                                            {isSaving ? 'Deleting...' : 'Delete Permanently'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (isLoading || !brand) {
        return (
            <BrandLayout brand={null}>
                <div className="settings-loading">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="settings-page">
                <div className="settings-header">
                    <h1>
                        <Settings size={20} />
                        Settings
                    </h1>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                        <button onClick={() => setError('')}>&times;</button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <CheckCircle size={14} />
                        <span>{success}</span>
                        <button onClick={() => setSuccess('')}>&times;</button>
                    </div>
                )}

                <div className="settings-layout">
                    {/* Sidebar */}
                    <div className="settings-sidebar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`sidebar-item ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'advanced' ? 'danger' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="settings-content">
                        {renderSettingsTab()}
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            <InviteModal
                brandId={id}
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={fetchTeamMembers}
            />

            <style jsx>{`
                .settings-page {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 24px;
                }

                .settings-header {
                    margin-bottom: 24px;
                }

                .settings-header h1 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 20px;
                    font-weight: 600;
                    color: #fafafa;
                    margin: 0;
                }

                .alert {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-bottom: 16px;
                }

                .alert-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .alert-success {
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                }

                .alert button {
                    margin-left: auto;
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 18px;
                    cursor: pointer;
                    opacity: 0.7;
                }

                .alert button:hover {
                    opacity: 1;
                }

                .settings-layout {
                    display: flex;
                    gap: 24px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .settings-sidebar {
                    width: 200px;
                    padding: 12px;
                    background: rgba(255,255,255,0.02);
                    border-right: 1px solid rgba(255,255,255,0.06);
                    flex-shrink: 0;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: #71717a;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.15s;
                    text-align: left;
                }

                .sidebar-item:hover {
                    background: rgba(255,255,255,0.04);
                    color: #a1a1aa;
                }

                .sidebar-item.active {
                    background: rgba(255,255,255,0.06);
                    color: #fafafa;
                }

                .sidebar-item.danger {
                    color: #71717a;
                }

                .sidebar-item.danger:hover {
                    color: #ef4444;
                }

                .sidebar-item.danger.active {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .settings-content {
                    flex: 1;
                    padding: 24px;
                    min-height: 400px;
                }

                .settings-content :global(.form-section) {
                    margin-bottom: 24px;
                }

                .settings-content :global(.section-title) {
                    font-size: 13px;
                    font-weight: 500;
                    color: #a1a1aa;
                    margin: 0 0 16px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }

                .settings-content :global(.form-row) {
                    margin-bottom: 16px;
                }

                .settings-content :global(.form-row label) {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: #a1a1aa;
                    margin-bottom: 6px;
                }

                .settings-content :global(.form-row input),
                .settings-content :global(.form-row select) {
                    width: 100%;
                    padding: 10px 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                    color: #fafafa;
                    font-size: 14px;
                    transition: all 0.15s;
                }

                .settings-content :global(.form-row select) {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    padding-right: 36px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 16px;
                    cursor: pointer;
                }

                .settings-content :global(.form-row input:focus),
                .settings-content :global(.form-row select:focus) {
                    outline: none;
                    border-color: rgba(255,255,255,0.15);
                    background: rgba(255,255,255,0.05);
                }

                .settings-content :global(.form-row input::placeholder) {
                    color: #52525b;
                }

                .settings-content :global(.form-row select option) {
                    background: #1c1c1c;
                    color: #fafafa;
                }

                .settings-content :global(.form-row input:disabled),
                .settings-content :global(.form-row select:disabled) {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .settings-content :global(.hint) {
                    display: block;
                    font-size: 12px;
                    color: #52525b;
                    margin-top: 6px;
                }

                .settings-content :global(.hint a) {
                    color: #6366f1;
                    text-decoration: none;
                }

                .settings-content :global(.hint a:hover) {
                    text-decoration: underline;
                }

                .settings-content :global(.form-grid-2) {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .settings-content :global(.form-footer) {
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }

                .settings-content :global(.save-btn) {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background: #fafafa;
                    border: none;
                    border-radius: 6px;
                    color: #0a0a0a;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .settings-content :global(.save-btn:hover) {
                    background: #e4e4e7;
                }

                .settings-content :global(.save-btn:disabled) {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .settings-content :global(.info-banner) {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 8px;
                    color: #f59e0b;
                    font-size: 13px;
                    margin-bottom: 20px;
                }

                .settings-content :global(.banner-link) {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-left: auto;
                    color: #f59e0b;
                    text-decoration: none;
                    font-weight: 500;
                }

                .settings-content :global(.banner-link:hover) {
                    text-decoration: underline;
                }

                .settings-content :global(.danger-section) {
                    padding: 0;
                }

                .settings-content :global(.danger-card) {
                    padding: 20px;
                    background: rgba(239, 68, 68, 0.05);
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    border-radius: 8px;
                }

                .settings-content :global(.danger-header) {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #ef4444;
                    margin-bottom: 8px;
                }

                .settings-content :global(.danger-header h4) {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                }

                .settings-content :global(.danger-card > p) {
                    margin: 0 0 16px;
                    font-size: 13px;
                    color: #71717a;
                    line-height: 1.5;
                }

                .settings-content :global(.delete-btn) {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 6px;
                    color: #ef4444;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .settings-content :global(.delete-btn:hover) {
                    background: rgba(239, 68, 68, 0.1);
                }

                .settings-content :global(.delete-confirm) {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(239, 68, 68, 0.15);
                }

                .settings-content :global(.delete-confirm p) {
                    margin: 0 0 10px;
                    font-size: 13px;
                    color: #a1a1aa;
                }

                .settings-content :global(.delete-confirm input) {
                    width: 100%;
                    padding: 10px 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                    color: #fafafa;
                    font-size: 14px;
                    margin-bottom: 12px;
                }

                .settings-content :global(.delete-confirm input:focus) {
                    outline: none;
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .settings-content :global(.delete-actions) {
                    display: flex;
                    gap: 10px;
                }

                .settings-content :global(.cancel-btn) {
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    color: #a1a1aa;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .settings-content :global(.cancel-btn:hover) {
                    background: rgba(255,255,255,0.05);
                }

                .settings-content :global(.confirm-delete-btn) {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: #ef4444;
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .settings-content :global(.confirm-delete-btn:hover) {
                    background: #dc2626;
                }

                .settings-content :global(.confirm-delete-btn:disabled) {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .settings-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 24px;
                    color: #71717a;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                :global(.spin) {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </BrandLayout>
    );
}

// Webhook Setup Component
function WebhookSetup({ provider, webhookUrl, onCopy, copied, domain }) {
    const [expanded, setExpanded] = useState(false);

    const instructions = {
        sendgrid: {
            title: 'SendGrid Event Webhook',
            steps: [
                'Go to SendGrid Mail Settings → Event Webhook',
                'Enter the webhook URL in the HTTP Post URL field',
                'Select events: Delivered, Bounced, Opened, Clicked, Spam Report',
                'Enable the webhook and save',
            ],
            link: 'https://app.sendgrid.com/settings/mail_settings',
        },
        mailgun: {
            title: 'Mailgun Webhooks',
            steps: [
                `Go to Mailgun → Select domain (${domain || 'your domain'})`,
                'Navigate to Webhooks in the sidebar',
                'Add the webhook URL for each event type',
                'Events: Delivered, Bounced, Opened, Clicked, Complained',
            ],
            link: 'https://app.mailgun.com/mg/sending/domains',
        },
    };

    const info = instructions[provider];

    return (
        <div className="webhook-setup">
            <button type="button" className="webhook-toggle" onClick={() => setExpanded(!expanded)}>
                <Webhook size={14} />
                <span>{info.title}</span>
                <ChevronRight size={14} className={`chevron ${expanded ? 'expanded' : ''}`} />
            </button>

            {expanded && (
                <div className="webhook-content">
                    <div className="webhook-url">
                        <label>Webhook URL</label>
                        <div className="url-box">
                            <code>{webhookUrl}</code>
                            <button type="button" onClick={() => onCopy(webhookUrl)}>
                                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="webhook-steps">
                        <h5>Setup Steps:</h5>
                        <ol>
                            {info.steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ol>
                        <a href={info.link} target="_blank" rel="noopener noreferrer" className="setup-link">
                            Open {provider === 'sendgrid' ? 'SendGrid' : 'Mailgun'} Dashboard <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            )}

            <style jsx>{`
                .webhook-setup {
                    margin-top: 20px;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .webhook-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 12px 14px;
                    background: rgba(255,255,255,0.02);
                    border: none;
                    color: #a1a1aa;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.15s;
                    text-align: left;
                }

                .webhook-toggle:hover {
                    background: rgba(255,255,255,0.04);
                }

                .chevron {
                    margin-left: auto;
                    transition: transform 0.15s;
                }

                .chevron.expanded {
                    transform: rotate(90deg);
                }

                .webhook-content {
                    padding: 16px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }

                .webhook-url {
                    margin-bottom: 16px;
                }

                .webhook-url label {
                    display: block;
                    font-size: 11px;
                    font-weight: 500;
                    color: #71717a;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 6px;
                }

                .url-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                }

                .url-box code {
                    flex: 1;
                    font-size: 12px;
                    color: #22c55e;
                    word-break: break-all;
                }

                .url-box button {
                    padding: 4px;
                    background: transparent;
                    border: none;
                    color: #71717a;
                    cursor: pointer;
                    transition: color 0.15s;
                }

                .url-box button:hover {
                    color: #fafafa;
                }

                .webhook-steps h5 {
                    font-size: 12px;
                    font-weight: 500;
                    color: #a1a1aa;
                    margin: 0 0 10px;
                }

                .webhook-steps ol {
                    margin: 0;
                    padding-left: 16px;
                    font-size: 12px;
                    color: #71717a;
                    line-height: 1.8;
                }

                .setup-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 12px;
                    font-size: 12px;
                    color: #6366f1;
                    text-decoration: none;
                }

                .setup-link:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}

// Team Tab Component
function TeamTab({ brandId, teamMembers, isLoading, onRefresh, onInvite }) {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopyInvite = async (memberId) => {
        try {
            const res = await fetch(`/api/brands/${brandId}/team/${memberId}/regenerate`, {
                method: 'POST',
                credentials: 'same-origin',
            });
            if (res.ok) {
                const { inviteUrl } = await res.json();
                await navigator.clipboard.writeText(inviteUrl);
                setCopiedId(memberId);
                setTimeout(() => setCopiedId(null), 2000);
            }
        } catch (error) {
            console.error('Error copying invite:', error);
        }
    };

    const handleRemove = async (memberId) => {
        if (!confirm('Remove this team member?')) return;

        try {
            const res = await fetch(`/api/brands/${brandId}/team/${memberId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });
            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            const res = await fetch(`/api/brands/${brandId}/team/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
                credentials: 'same-origin',
            });
            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="team-loading">
                <Loader size={20} className="spin" />
                <span>Loading team...</span>
            </div>
        );
    }

    return (
        <div className="team-section">
            <div className="team-header">
                <div className="team-header-info">
                    <h3>Team Members</h3>
                    <p>Invite team members to collaborate on this brand</p>
                </div>
                <button className="invite-btn" onClick={onInvite}>
                    <UserPlus size={14} />
                    Invite Member
                </button>
            </div>

            {teamMembers.length === 0 ? (
                <div className="team-empty">
                    <Users size={32} />
                    <p>No team members yet</p>
                    <span>Invite your first team member to get started</span>
                </div>
            ) : (
                <div className="team-list">
                    {teamMembers.map((member) => (
                        <div key={member._id} className="team-member">
                            <div className="member-info">
                                <div className="member-avatar">
                                    {member.userId?.name?.[0] || member.email[0].toUpperCase()}
                                </div>
                                <div className="member-details">
                                    <span className="member-name">
                                        {member.userId?.name || member.email}
                                    </span>
                                    <span className="member-email">{member.email}</span>
                                </div>
                            </div>

                            <div className="member-status">
                                {member.status === 'pending' ? (
                                    <span className="status-badge pending">Pending</span>
                                ) : (
                                    <span className="status-badge active">Active</span>
                                )}
                            </div>

                            <div className="member-role">
                                <select
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member._id, e.target.value)}
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                </select>
                            </div>

                            <div className="member-actions">
                                {member.status === 'pending' && (
                                    <button
                                        className="action-btn"
                                        onClick={() => handleCopyInvite(member._id)}
                                        title="Copy invite link"
                                    >
                                        {copiedId === member._id ? (
                                            <Check size={14} />
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                    </button>
                                )}
                                <button
                                    className="action-btn danger"
                                    onClick={() => handleRemove(member._id)}
                                    title="Remove member"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .team-section {
                    padding: 0;
                }

                .team-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }

                .team-header-info h3 {
                    margin: 0 0 4px;
                    font-size: 15px;
                    font-weight: 600;
                    color: #fafafa;
                }

                .team-header-info p {
                    margin: 0;
                    font-size: 13px;
                    color: #71717a;
                }

                .invite-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: #fafafa;
                    border: none;
                    border-radius: 6px;
                    color: #0a0a0a;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .invite-btn:hover {
                    background: #e4e4e7;
                }

                .team-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 24px;
                    background: rgba(255,255,255,0.02);
                    border: 1px dashed rgba(255,255,255,0.1);
                    border-radius: 8px;
                    color: #52525b;
                }

                .team-empty p {
                    margin: 12px 0 4px;
                    font-size: 14px;
                    color: #71717a;
                }

                .team-empty span {
                    font-size: 13px;
                }

                .team-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .team-member {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 8px;
                    transition: all 0.15s;
                }

                .team-member:hover {
                    background: rgba(255,255,255,0.04);
                }

                .member-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }

                .member-avatar {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(99, 102, 241, 0.2);
                    border-radius: 50%;
                    color: #818cf8;
                    font-size: 14px;
                    font-weight: 600;
                    flex-shrink: 0;
                }

                .member-details {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .member-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #fafafa;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .member-email {
                    font-size: 12px;
                    color: #71717a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .member-status {
                    flex-shrink: 0;
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    font-size: 11px;
                    font-weight: 500;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .status-badge.pending {
                    background: rgba(245, 158, 11, 0.15);
                    color: #f59e0b;
                }

                .status-badge.active {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                }

                .member-role {
                    flex-shrink: 0;
                }

                .member-role select {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    padding: 6px 28px 6px 10px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 4px;
                    color: #a1a1aa;
                    font-size: 12px;
                    cursor: pointer;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 8px center;
                    background-size: 14px;
                }

                .member-role select:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.15);
                }

                .member-role select option {
                    background: #1c1c1c;
                    color: #fafafa;
                }

                .member-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                    color: #71717a;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .action-btn:hover {
                    background: rgba(255,255,255,0.05);
                    color: #a1a1aa;
                }

                .action-btn.danger:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .team-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 48px 24px;
                    color: #71717a;
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
}

// Invite Modal Component
function InviteModal({ brandId, isOpen, onClose, onSuccess }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');
    const [inviteUrl, setInviteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/brands/${brandId}/team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
                credentials: 'same-origin',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            setInviteUrl(data.inviteUrl);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setEmail('');
        setRole('viewer');
        setInviteUrl('');
        setError('');
        onSuccess?.();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Invite Team Member</h3>
                    <button className="close-btn" onClick={handleClose}>
                        <X size={18} />
                    </button>
                </div>

                {!inviteUrl ? (
                    <form onSubmit={handleSubmit} className="modal-body">
                        {error && (
                            <div className="modal-alert error">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teammate@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="viewer">Viewer - Read-only access</option>
                                <option value="editor">Editor - Full access except team management</option>
                            </select>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={handleClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader size={14} className="spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={14} />
                                        Create Invite
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="modal-body success-view">
                        <div className="success-icon">
                            <CheckCircle size={32} />
                        </div>
                        <h4>Invitation Created!</h4>
                        <p>Share this link with {email}:</p>

                        <div className="invite-url-box">
                            <code>{inviteUrl}</code>
                            <button onClick={handleCopy} title="Copy link">
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>

                        <p className="hint">This link expires in 7 days</p>

                        <button className="btn-primary full-width" onClick={handleClose}>
                            Done
                        </button>
                    </div>
                )}

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 24px;
                    }

                    .modal {
                        width: 100%;
                        max-width: 420px;
                        background: #1c1c1c;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 12px;
                        overflow: hidden;
                    }

                    .modal-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 16px 20px;
                        border-bottom: 1px solid rgba(255,255,255,0.06);
                    }

                    .modal-header h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #fafafa;
                    }

                    .close-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        background: transparent;
                        border: none;
                        color: #71717a;
                        cursor: pointer;
                        border-radius: 6px;
                        transition: all 0.15s;
                    }

                    .close-btn:hover {
                        background: rgba(255,255,255,0.05);
                        color: #a1a1aa;
                    }

                    .modal-body {
                        padding: 20px;
                    }

                    .modal-alert {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                        margin-bottom: 16px;
                    }

                    .modal-alert.error {
                        background: rgba(239, 68, 68, 0.1);
                        border: 1px solid rgba(239, 68, 68, 0.2);
                        color: #ef4444;
                    }

                    .form-group {
                        margin-bottom: 16px;
                    }

                    .form-group label {
                        display: block;
                        font-size: 13px;
                        font-weight: 500;
                        color: #a1a1aa;
                        margin-bottom: 6px;
                    }

                    .form-group input,
                    .form-group select {
                        width: 100%;
                        padding: 10px 12px;
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 6px;
                        color: #fafafa;
                        font-size: 14px;
                        transition: all 0.15s;
                    }

                    .form-group select {
                        appearance: none;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        padding-right: 36px;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 12px center;
                        background-size: 16px;
                        cursor: pointer;
                    }

                    .form-group input:focus,
                    .form-group select:focus {
                        outline: none;
                        border-color: rgba(255,255,255,0.15);
                        background: rgba(255,255,255,0.05);
                    }

                    .form-group input::placeholder {
                        color: #52525b;
                    }

                    .form-group select option {
                        background: #1c1c1c;
                        color: #fafafa;
                    }

                    .modal-footer {
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                        margin-top: 20px;
                        padding-top: 16px;
                        border-top: 1px solid rgba(255,255,255,0.06);
                    }

                    .btn-secondary {
                        padding: 10px 16px;
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 6px;
                        color: #a1a1aa;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.15s;
                    }

                    .btn-secondary:hover {
                        background: rgba(255,255,255,0.05);
                    }

                    .btn-primary {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 10px 16px;
                        background: #fafafa;
                        border: none;
                        border-radius: 6px;
                        color: #0a0a0a;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.15s;
                    }

                    .btn-primary:hover {
                        background: #e4e4e7;
                    }

                    .btn-primary:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .btn-primary.full-width {
                        width: 100%;
                        justify-content: center;
                    }

                    .success-view {
                        text-align: center;
                    }

                    .success-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 56px;
                        height: 56px;
                        margin: 0 auto 16px;
                        background: rgba(34, 197, 94, 0.15);
                        border-radius: 50%;
                        color: #22c55e;
                    }

                    .success-view h4 {
                        margin: 0 0 8px;
                        font-size: 16px;
                        font-weight: 600;
                        color: #fafafa;
                    }

                    .success-view p {
                        margin: 0 0 16px;
                        font-size: 13px;
                        color: #71717a;
                    }

                    .invite-url-box {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 12px;
                        background: rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 6px;
                        margin-bottom: 12px;
                    }

                    .invite-url-box code {
                        flex: 1;
                        font-size: 12px;
                        color: #22c55e;
                        word-break: break-all;
                        text-align: left;
                    }

                    .invite-url-box button {
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 28px;
                        height: 28px;
                        background: rgba(255,255,255,0.05);
                        border: none;
                        border-radius: 4px;
                        color: #71717a;
                        cursor: pointer;
                        transition: all 0.15s;
                    }

                    .invite-url-box button:hover {
                        background: rgba(255,255,255,0.1);
                        color: #fafafa;
                    }

                    .hint {
                        font-size: 12px;
                        color: #52525b;
                        margin-bottom: 20px;
                    }
                `}</style>
            </div>
        </div>
    );
}
