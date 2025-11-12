import { useState, useEffect } from 'react';
import { Copy, Key, Globe, Settings, Check, X, Plus, Trash, RefreshCw } from 'lucide-react';

export default function ContactListApiSettings({ brandId, listId }) {
    const [apiSettings, setApiSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);

    const [newDomain, setNewDomain] = useState('');
    const [localSettings, setLocalSettings] = useState({
        apiEnabled: false,
        allowedDomains: [],
        apiSettings: {
            allowDuplicates: false,
            redirectUrl: '',
        },
    });

    useEffect(() => {
        fetchApiSettings();
    }, [brandId, listId]);

    const fetchApiSettings = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/api-settings`, {
                credentials: 'same-origin',
            });

            if (!res.ok) throw new Error('Failed to fetch API settings');

            const data = await res.json();
            setApiSettings(data);
            setLocalSettings({
                apiEnabled: data.apiEnabled,
                allowedDomains: data.allowedDomains || [],
                apiSettings: data.apiSettings || {
                    allowDuplicates: false,
                    redirectUrl: '',
                },
            });
        } catch (error) {
            console.error('Error fetching API settings:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generateApiKey = async () => {
        if (!window.confirm('Generate a new API key? This will replace your current key.')) {
            return;
        }

        try {
            setIsSaving(true);
            const res = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/api-settings`, {
                method: 'POST',
                credentials: 'same-origin',
            });

            if (!res.ok) throw new Error('Failed to generate API key');

            const data = await res.json();
            setSuccess('API key generated successfully');
            fetchApiSettings();

            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error generating API key:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const saveSettings = async () => {
        try {
            setIsSaving(true);
            const res = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/api-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(localSettings),
            });

            if (!res.ok) throw new Error('Failed to save settings');

            setSuccess('Settings saved successfully');
            fetchApiSettings();

            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addDomain = () => {
        if (newDomain && !localSettings.allowedDomains.includes(newDomain)) {
            setLocalSettings({
                ...localSettings,
                allowedDomains: [...localSettings.allowedDomains, newDomain],
            });
            setNewDomain('');
        }
    };

    const removeDomain = (domain) => {
        setLocalSettings({
            ...localSettings,
            allowedDomains: localSettings.allowedDomains.filter((d) => d !== domain),
        });
    };

    if (isLoading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p>Loading API settings...</p>
            </div>
        );
    }

    const apiEndpoint = apiSettings?.apiKey ? `${window.location.origin}/api/public/contacts/${apiSettings.apiKey}` : '';

    const exampleCode = apiSettings?.apiKey
        ? `<!-- HTML Form Example -->
<form action="${apiEndpoint}" method="POST">
  <input type="email" name="email" placeholder="Email" required />
  <input type="text" name="firstName" placeholder="First Name" />
  <input type="text" name="lastName" placeholder="Last Name" />
  <input type="tel" name="phone" placeholder="Phone" />
  <button type="submit">Subscribe</button>
</form>

<!-- JavaScript Fetch Example -->
<script>
fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890'
  })
})
.then(res => res.json())
.then(data => console.log(data));
</script>`
        : '';

    return (
        <div className="api-settings-container">
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '500' }}>
                    <Settings
                        size={20}
                        style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
                    />
                    API Access
                </h2>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Allow external forms and applications to add contacts to this list</p>
            </div>

            {error && (
                <div
                    className="alert alert--error"
                    style={{ marginBottom: '1rem' }}
                >
                    <span>{error}</span>
                    <button onClick={() => setError('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div
                    className="alert alert--success"
                    style={{ marginBottom: '1rem' }}
                >
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* API Key Section */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
                        <Key
                            size={18}
                            style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
                        />
                        API Key
                    </h3>
                    <button
                        className="button button--secondary button--small"
                        onClick={generateApiKey}
                        disabled={isSaving}
                    >
                        <RefreshCw size={14} />
                        {apiSettings?.apiKey ? 'Regenerate' : 'Generate'}
                    </button>
                </div>

                {apiSettings?.apiKey ? (
                    <>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={apiEndpoint}
                                readOnly
                                className="form-input"
                                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                            />
                            <button
                                className="button button--secondary"
                                onClick={() => copyToClipboard(apiEndpoint)}
                                title="Copy API endpoint"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label
                                className="form-label"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <input
                                    type="checkbox"
                                    checked={localSettings.apiEnabled}
                                    onChange={(e) =>
                                        setLocalSettings({
                                            ...localSettings,
                                            apiEnabled: e.target.checked,
                                        })
                                    }
                                />
                                <span>Enable API access</span>
                            </label>
                        </div>
                    </>
                ) : (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Generate an API key to enable external access to this contact list</p>
                )}
            </div>

            {/* Allowed Domains */}
            {apiSettings?.apiKey && (
                <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '500' }}>
                        <Globe
                            size={18}
                            style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}
                        />
                        Allowed Domains
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#666' }}>Restrict API access to specific domains. Leave empty to allow all domains.</p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="example.com"
                            className="form-input"
                            onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                        />
                        <button
                            className="button button--secondary"
                            onClick={addDomain}
                            disabled={!newDomain}
                        >
                            <Plus size={16} />
                            Add
                        </button>
                    </div>

                    {localSettings.allowedDomains.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {localSettings.allowedDomains.map((domain, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0.75rem',
                                        background: '#fafafa',
                                        borderRadius: '0.375rem',
                                    }}
                                >
                                    <span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{domain}</span>
                                    <button
                                        className="action-btn delete-btn"
                                        onClick={() => removeDomain(domain)}
                                        title="Remove domain"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Additional Settings */}
            {apiSettings?.apiKey && (
                <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '500' }}>Additional Settings</h3>

                    <div className="form-group">
                        <label
                            className="form-label"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <input
                                type="checkbox"
                                checked={localSettings.apiSettings.allowDuplicates}
                                onChange={(e) =>
                                    setLocalSettings({
                                        ...localSettings,
                                        apiSettings: {
                                            ...localSettings.apiSettings,
                                            allowDuplicates: e.target.checked,
                                        },
                                    })
                                }
                            />
                            <span>Allow duplicate submissions</span>
                        </label>
                        <p className="form-help">If disabled, duplicate emails will be ignored</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Redirect URL (optional)</label>
                        <input
                            type="url"
                            value={localSettings.apiSettings.redirectUrl}
                            onChange={(e) =>
                                setLocalSettings({
                                    ...localSettings,
                                    apiSettings: {
                                        ...localSettings.apiSettings,
                                        redirectUrl: e.target.value,
                                    },
                                })
                            }
                            placeholder="https://example.com/thank-you"
                            className="form-input"
                        />
                        <p className="form-help">URL to redirect to after successful submission</p>
                    </div>
                </div>
            )}

            {/* Code Examples */}
            {apiSettings?.apiKey && apiEndpoint && (
                <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Code Examples</h3>
                        <button
                            className="button button--secondary button--small"
                            onClick={() => copyToClipboard(exampleCode)}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            Copy
                        </button>
                    </div>
                    <pre
                        style={{
                            background: '#1a1a1a',
                            color: '#fff',
                            padding: '1rem',
                            borderRadius: '0.375rem',
                            overflow: 'auto',
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                        }}
                    >
                        {exampleCode}
                    </pre>
                </div>
            )}

            {/* Save Button */}
            {apiSettings?.apiKey && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                        className="button button--secondary"
                        onClick={fetchApiSettings}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        className="button button--primary"
                        onClick={saveSettings}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            )}
        </div>
    );
}
