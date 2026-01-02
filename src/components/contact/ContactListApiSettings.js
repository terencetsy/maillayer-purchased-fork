// src/components/contact/ContactListApiSettings.js
import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Globe, Code, ChevronDown, ChevronUp, Plus, X, Info } from 'lucide-react';

export default function ContactListApiSettings({ brandId, listId }) {
    const [settings, setSettings] = useState({
        apiKey: '',
        apiEnabled: false,
        allowedDomains: [],
        apiSettings: {
            allowDuplicates: false,
            redirectUrl: '',
        },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);
    const [copiedExample, setCopiedExample] = useState(null);
    const [newDomain, setNewDomain] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activeTab, setActiveTab] = useState('javascript'); // javascript, html, curl

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    useEffect(() => {
        fetchSettings();
    }, [brandId, listId]);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/api-settings`);
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error('Error fetching API settings:', err);
            setError('Failed to load API settings');
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setIsSaving(true);
            setError('');

            const res = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/api-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) {
                throw new Error('Failed to save settings');
            }

            setSuccess('Settings saved successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const regenerateApiKey = async () => {
        if (!window.confirm('Are you sure you want to regenerate the API key? The old key will stop working immediately.')) {
            return;
        }

        try {
            const res = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/api-settings/regenerate`, {
                method: 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                setSettings((prev) => ({ ...prev, apiKey: data.apiKey }));
                setSuccess('API key regenerated successfully');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to regenerate API key');
        }
    };

    const copyToClipboard = async (text, exampleId = null) => {
        try {
            await navigator.clipboard.writeText(text);
            if (exampleId) {
                setCopiedExample(exampleId);
                setTimeout(() => setCopiedExample(null), 2000);
            } else {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const addDomain = () => {
        if (!newDomain.trim()) return;

        const domain = newDomain
            .trim()
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '');

        if (!settings.allowedDomains.includes(domain)) {
            setSettings((prev) => ({
                ...prev,
                allowedDomains: [...prev.allowedDomains, domain],
            }));
        }
        setNewDomain('');
    };

    const removeDomain = (domain) => {
        setSettings((prev) => ({
            ...prev,
            allowedDomains: prev.allowedDomains.filter((d) => d !== domain),
        }));
    };

    const apiEndpoint = `${baseUrl}/api/public/contacts/${settings.apiKey}`;

    // Code examples
    const codeExamples = {
        javascript: `// Basic usage
fetch('${apiEndpoint}', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
    })
})
.then(res => res.json())
.then(data => console.log(data));

// With custom fields
fetch('${apiEndpoint}', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        // Custom fields - add any data you need
        customFields: {
            company: 'Acme Inc',
            jobTitle: 'Developer',
            plan: 'premium',
            referralSource: 'google',
            signupPage: window.location.pathname,
            interests: ['saas', 'marketing', 'automation'],
            metadata: {
                campaign: 'summer-sale',
                utm_source: 'newsletter'
            }
        }
    })
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        // Handle success
        if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
        }
    }
});`,

        javascriptShort: `// Shorthand - extra fields automatically become custom fields
fetch('${apiEndpoint}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'user@example.com',
        firstName: 'John',
        company: 'Acme Inc',     // → customFields.company
        plan: 'premium',          // → customFields.plan
        referralSource: 'google'  // → customFields.referralSource
    })
});`,

        html: `<!-- Basic Form -->
<form id="subscribeForm">
    <input type="email" name="email" placeholder="Email" required />
    <input type="text" name="firstName" placeholder="First Name" />
    <input type="text" name="lastName" placeholder="Last Name" />
    <button type="submit">Subscribe</button>
</form>

<script>
document.getElementById('subscribeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const response = await fetch('${apiEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName')
        })
    });

    const data = await response.json();

    if (data.success) {
        alert('Successfully subscribed!');
        e.target.reset();
    }
});
</script>

<!-- Form with Custom Fields -->
<form id="leadForm">
    <input type="email" name="email" placeholder="Email" required />
    <input type="text" name="firstName" placeholder="First Name" />
    <input type="text" name="company" placeholder="Company" />
    <select name="plan">
        <option value="starter">Starter</option>
        <option value="pro">Pro</option>
        <option value="enterprise">Enterprise</option>
    </select>
    <input type="hidden" name="referralSource" value="landing-page" />
    <button type="submit">Get Started</button>
</form>

<script>
document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    // All extra fields go to customFields
    const response = await fetch('${apiEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            customFields: {
                company: formData.get('company'),
                plan: formData.get('plan'),
                referralSource: formData.get('referralSource'),
                signupUrl: window.location.href,
                signupDate: new Date().toISOString()
            }
        })
    });

    const data = await response.json();
    if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
    }
});
</script>`,

        curl: `# Basic request
curl -X POST '${apiEndpoint}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'

# With custom fields
curl -X POST '${apiEndpoint}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "customFields": {
      "company": "Acme Inc",
      "plan": "premium",
      "referralSource": "api",
      "tags": ["lead", "enterprise"],
      "metadata": {
        "source": "crm-integration",
        "importedAt": "2024-01-15"
      }
    }
  }'

# Response (success)
{
  "success": true,
  "message": "Contact added successfully",
  "contactId": "507f1f77bcf86cd799439011",
  "redirectUrl": null
}

# Response (duplicate)
{
  "success": true,
  "message": "Contact already exists in this list",
  "contactId": "507f1f77bcf86cd799439011",
  "duplicate": true,
  "customFieldsUpdated": true
}`,

        react: `import { useState } from 'react';

function SubscribeForm() {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [company, setCompany] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('${apiEndpoint}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    firstName,
                    customFields: {
                        company,
                        signupSource: 'react-app',
                        signupTimestamp: Date.now()
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage(data.duplicate
                    ? 'You\\'re already subscribed!'
                    : 'Successfully subscribed!');
                setEmail('');
                setFirstName('');
                setCompany('');
            } else {
                setMessage(data.message || 'Something went wrong');
            }
        } catch (error) {
            setMessage('Failed to subscribe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
            />
            <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
            {message && <p>{message}</p>}
        </form>
    );
}`,

        nextjs: `// pages/api/subscribe.js (or app/api/subscribe/route.js)
// Proxy through your own API for added security

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, firstName, lastName, ...customData } = req.body;

    try {
        const response = await fetch('${apiEndpoint}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                firstName,
                lastName,
                customFields: {
                    ...customData,
                    subscribedVia: 'nextjs-api',
                    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    userAgent: req.headers['user-agent']
                }
            })
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to subscribe'
        });
    }
}`,
    };

    if (isLoading) {
        return (
            <div className="chart-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="api-settings">
            {error && (
                <div className="cld-alert cld-alert--error">
                    <span>{error}</span>
                    <button className="cld-alert-close" onClick={() => setError('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div className="cld-alert cld-alert--success">
                    <span>{success}</span>
                    <button className="cld-alert-close" onClick={() => setSuccess('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Enable API Toggle */}
            <div className="api-card">
                <div className="api-card-header">
                    <div>
                        <h3 className="api-card-title">API Access</h3>
                        <p className="api-card-desc">Allow external forms and applications to add contacts to this list</p>
                    </div>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            className="dark-checkbox"
                            checked={settings.apiEnabled}
                            onChange={(e) => setSettings((prev) => ({ ...prev, apiEnabled: e.target.checked }))}
                        />
                        <span className="api-toggle-label">{settings.apiEnabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                </div>

                {settings.apiEnabled && (
                    <>
                        {/* API Key */}
                        <div className="api-key-section">
                            <label className="api-key-label">API Key</label>
                            <div className="api-key-input-wrapper">
                                <div className="api-key-field">
                                    <input
                                        type="text"
                                        className="api-key-input"
                                        value={settings.apiKey || 'No API key generated'}
                                        readOnly
                                    />
                                    <button
                                        className={`api-key-copy ${copied ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(settings.apiKey)}
                                        title="Copy API key"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <button
                                    className="button button--secondary"
                                    onClick={regenerateApiKey}
                                    title="Regenerate API key"
                                >
                                    <RefreshCw size={16} />
                                    <span>Regenerate</span>
                                </button>
                            </div>
                        </div>

                        {/* API Endpoint */}
                        <div className="api-key-section">
                            <label className="api-key-label">API Endpoint</label>
                            <div className="api-endpoint">
                                POST {apiEndpoint}
                            </div>
                        </div>

                        {/* Allowed Domains */}
                        <div className="api-domains-section">
                            <label className="api-domains-label">
                                <Globe size={14} />
                                Allowed Domains
                            </label>
                            <p className="api-domains-desc">Restrict API access to specific domains. Leave empty to allow all domains.</p>

                            <div className="api-domains-input-wrapper">
                                <input
                                    type="text"
                                    className="api-domains-input"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    placeholder="example.com"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                                />
                                <button
                                    className="button button--secondary"
                                    onClick={addDomain}
                                >
                                    <Plus size={16} />
                                    <span>Add</span>
                                </button>
                            </div>

                            {settings.allowedDomains.length > 0 && (
                                <div className="api-domains-list">
                                    {settings.allowedDomains.map((domain) => (
                                        <span key={domain} className="api-domain-tag">
                                            {domain}
                                            <button
                                                className="api-domain-remove"
                                                onClick={() => removeDomain(domain)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Additional Settings */}
                        <div className="api-settings-option">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    className="dark-checkbox"
                                    checked={settings.apiSettings?.allowDuplicates || false}
                                    onChange={(e) =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            apiSettings: { ...prev.apiSettings, allowDuplicates: e.target.checked },
                                        }))
                                    }
                                />
                                <span>
                                    <strong>Allow duplicate submissions</strong>
                                    <span> - If disabled, duplicate emails will update custom fields only</span>
                                </span>
                            </label>
                        </div>

                        <div className="api-redirect-section">
                            <label className="api-redirect-label">Redirect URL (optional)</label>
                            <input
                                type="url"
                                className="api-redirect-input"
                                value={settings.apiSettings?.redirectUrl || ''}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        apiSettings: { ...prev.apiSettings, redirectUrl: e.target.value },
                                    }))
                                }
                                placeholder="https://example.com/thank-you"
                            />
                            <p className="api-redirect-hint">Returned in API response for client-side redirects</p>
                        </div>

                        <button
                            className="button button--primary"
                            onClick={saveSettings}
                            disabled={isSaving}
                            style={{ marginTop: '1rem' }}
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </>
                )}
            </div>

            {/* API Documentation */}
            {settings.apiEnabled && (
                <div className="api-docs">
                    <h3 className="api-docs-title">
                        <Code size={18} />
                        API Documentation
                    </h3>

                    {/* Request/Response Info */}
                    <div className="api-docs-table">
                        <h4 className="api-docs-table-title">Request Format</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Type</th>
                                    <th>Required</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><code className="api-field-code api-field-code--required">email</code></td>
                                    <td>string</td>
                                    <td><span className="api-required">Yes</span></td>
                                    <td>Contact&apos;s email address</td>
                                </tr>
                                <tr>
                                    <td><code className="api-field-code">firstName</code></td>
                                    <td>string</td>
                                    <td>No</td>
                                    <td>Contact&apos;s first name</td>
                                </tr>
                                <tr>
                                    <td><code className="api-field-code">lastName</code></td>
                                    <td>string</td>
                                    <td>No</td>
                                    <td>Contact&apos;s last name</td>
                                </tr>
                                <tr>
                                    <td><code className="api-field-code">phone</code></td>
                                    <td>string</td>
                                    <td>No</td>
                                    <td>Contact&apos;s phone number</td>
                                </tr>
                                <tr>
                                    <td><code className="api-field-code api-field-code--optional">customFields</code></td>
                                    <td>object</td>
                                    <td>No</td>
                                    <td>Any additional data (see below)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Custom Fields Info Box */}
                    <div className="api-custom-fields-info">
                        <h4 className="api-custom-fields-title">
                            <Info size={16} />
                            Custom Fields
                        </h4>
                        <p className="api-custom-fields-desc">
                            Store any additional data with your contacts using the <code>customFields</code> object. This is perfect for:
                        </p>
                        <ul className="api-custom-fields-list">
                            <li>Tracking referral sources and UTM parameters</li>
                            <li>Storing company information and job titles</li>
                            <li>Recording signup page URLs and timestamps</li>
                            <li>Segmentation data (interests, preferences, plans)</li>
                            <li>Any metadata your application needs</li>
                        </ul>
                        <div className="api-custom-fields-tip">
                            <strong>Pro tip:</strong> Any extra fields you send (besides email, firstName, lastName, phone) are automatically added to customFields!
                        </div>
                    </div>

                    {/* Code Examples Tabs */}
                    <div>
                        <div className="api-code-tabs">
                            {[
                                { id: 'javascript', label: 'JavaScript' },
                                { id: 'html', label: 'HTML Form' },
                                { id: 'curl', label: 'cURL' },
                                { id: 'react', label: 'React' },
                                { id: 'nextjs', label: 'Next.js' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`api-code-tab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Code Block */}
                        <div className="api-code-block">
                            <button
                                className={`api-code-copy ${copiedExample === activeTab ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(codeExamples[activeTab], activeTab)}
                            >
                                {copiedExample === activeTab ? <Check size={14} /> : <Copy size={14} />}
                                {copiedExample === activeTab ? 'Copied!' : 'Copy'}
                            </button>
                            <pre className="api-code-pre">
                                <code>{codeExamples[activeTab]}</code>
                            </pre>
                        </div>
                    </div>

                    {/* Shorthand Example */}
                    {activeTab === 'javascript' && (
                        <div>
                            <button
                                className="api-shorthand-toggle"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                Shorthand Syntax
                            </button>

                            {showAdvanced && (
                                <div className="api-shorthand-content">
                                    <p>You can also pass custom fields directly in the body - they&apos;ll automatically be stored in customFields:</p>
                                    <div className="api-code-block">
                                        <button
                                            className={`api-code-copy ${copiedExample === 'shorthand' ? 'copied' : ''}`}
                                            onClick={() => copyToClipboard(codeExamples.javascriptShort, 'shorthand')}
                                        >
                                            {copiedExample === 'shorthand' ? <Check size={14} /> : <Copy size={14} />}
                                            {copiedExample === 'shorthand' ? 'Copied!' : 'Copy'}
                                        </button>
                                        <pre className="api-code-pre">
                                            <code>{codeExamples.javascriptShort}</code>
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Response Format */}
                    <div className="api-response-section">
                        <h4 className="api-response-title">Response Format</h4>
                        <div className="api-response-item">
                            <span className="api-response-badge api-response-badge--success">201 Created</span>
                            <pre className="api-response-pre">
                                <code>{`{
  "success": true,
  "message": "Contact added successfully",
  "contactId": "507f1f77bcf86cd799439011",
  "redirectUrl": "${settings.apiSettings?.redirectUrl || 'null'}"
}`}</code>
                            </pre>
                        </div>
                        <div className="api-response-item">
                            <span className="api-response-badge api-response-badge--warning">200 Duplicate</span>
                            <pre className="api-response-pre">
                                <code>{`{
  "success": true,
  "message": "Contact already exists in this list",
  "contactId": "507f1f77bcf86cd799439011",
  "duplicate": true,
  "customFieldsUpdated": true
}`}</code>
                            </pre>
                        </div>
                        <div className="api-response-item">
                            <span className="api-response-badge api-response-badge--error">400 Error</span>
                            <pre className="api-response-pre">
                                <code>{`{
  "success": false,
  "message": "Email is required"
}`}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
