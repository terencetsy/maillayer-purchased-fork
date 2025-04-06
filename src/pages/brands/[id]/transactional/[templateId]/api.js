import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Code, Key, Copy, Check, AlertTriangle, Info, Eye } from 'lucide-react';

export default function TemplateApiDocs() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, templateId } = router.query;

    const [brand, setBrand] = useState(null);
    const [template, setTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [activeTab, setActiveTab] = useState('curl');

    useEffect(() => {
        // Set the base URL for API endpoints
        setBaseUrl(window.location.origin);
    }, []);

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

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const regenerateApiKey = async () => {
        if (!confirm('Are you sure you want to regenerate the API key? This will invalidate the current key and any integrations using it will stop working.')) {
            return;
        }

        try {
            setIsRegenerating(true);
            const res = await fetch(`/api/brands/${id}/transactional/${templateId}/regenerate-key`, {
                method: 'POST',
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('Failed to regenerate API key');
            }

            const data = await res.json();

            // Update the template with the new API key
            setTemplate({
                ...template,
                apiKey: data.apiKey,
            });
        } catch (error) {
            console.error('Error regenerating API key:', error);
            setError(error.message);
        } finally {
            setIsRegenerating(false);
        }
    };

    // Generate example code snippets
    const generateCurlExample = () => {
        if (!template) return '';

        const variableExamples = {};
        if (template.variables && template.variables.length > 0) {
            template.variables.forEach((v) => {
                variableExamples[v.name] = `example_${v.name}`;
            });
        }

        return `curl -X POST "${baseUrl}/api/transactional/send" \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${template.apiKey}",
    "to": "recipient@example.com",
    "variables": ${JSON.stringify(variableExamples, null, 4).replace(/\n/g, '\n    ')}
  }'`;
    };

    const generateNodeExample = () => {
        if (!template) return '';

        const variableExamples = {};
        if (template.variables && template.variables.length > 0) {
            template.variables.forEach((v) => {
                variableExamples[v.name] = `example_${v.name}`;
            });
        }

        return `const axios = require('axios');

async function sendEmail() {
  try {
    const response = await axios.post('${baseUrl}/api/transactional/send', {
      apiKey: '${template.apiKey}',
      to: 'recipient@example.com',
      variables: ${JSON.stringify(variableExamples, null, 2).replace(/\n/g, '\n    ')}
    });
    
    console.log('Email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    throw error;
  }
}

sendEmail();`;
    };

    const generatePythonExample = () => {
        if (!template) return '';

        const variableExamples = {};
        if (template.variables && template.variables.length > 0) {
            template.variables.forEach((v) => {
                variableExamples[v.name] = `example_${v.name}`;
            });
        }

        return `import requests
import json

def send_email():
    url = "${baseUrl}/api/transactional/send"
    
    payload = {
        "apiKey": "${template.apiKey}",
        "to": "recipient@example.com",
        "variables": ${JSON.stringify(variableExamples, null, 4).replace(/\n/g, '\n    ')}
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        print("Email sent successfully:", response.json())
        return response.json()
    else:
        print("Error sending email:", response.text)
        response.raise_for_status()

if __name__ == "__main__":
    send_email()`;
    };

    // This is used just for the layout to identify the brand
    if (isLoading && !brand) return null;

    return (
        <BrandLayout brand={brand}>
            <div className="api-docs-container">
                <div className="api-docs-header">
                    <Link
                        href={`/brands/${id}/transactional/${templateId}`}
                        className="back-link"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to template</span>
                    </Link>

                    <h1>
                        <Code
                            size={24}
                            className="api-icon"
                        />
                        API Documentation
                    </h1>

                    {template && <h2 className="template-name">{template.name}</h2>}
                </div>

                {error && (
                    <div className="api-error">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="api-loading">
                        <div className="spinner"></div>
                        <p>Loading API details...</p>
                    </div>
                ) : (
                    <>
                        {template?.status !== 'active' && (
                            <div className="api-warning">
                                <AlertTriangle size={18} />
                                <div>
                                    <h3>Template Not Published</h3>
                                    <p>This template is not active yet. Please publish it before using in production.</p>
                                    <Link
                                        href={`/brands/${id}/transactional/${templateId}/editor`}
                                        className="publish-link"
                                    >
                                        Go to editor to publish
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="api-key-section">
                            <h3>
                                <Key size={18} />
                                <span>API Key</span>
                            </h3>
                            <div className="api-key-container">
                                <div className="api-key-field">
                                    <input
                                        type="text"
                                        value={template?.apiKey || ''}
                                        readOnly
                                        className="api-key-input"
                                    />
                                    <button
                                        className="copy-button"
                                        onClick={() => copyToClipboard(template?.apiKey)}
                                        title="Copy API key"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <button
                                    className="regenerate-button"
                                    onClick={regenerateApiKey}
                                    disabled={isRegenerating}
                                >
                                    {isRegenerating ? 'Regenerating...' : 'Regenerate Key'}
                                </button>
                            </div>
                            <div className="api-key-warning">
                                <AlertTriangle size={14} />
                                <span>Keep this API key secret. Regenerating will invalidate the previous key.</span>
                            </div>
                        </div>

                        <div className="api-endpoint-section">
                            <h3>API Endpoint</h3>
                            <div className="endpoint-url">
                                <code>{baseUrl}/api/transactional/send</code>
                                <button
                                    className="copy-button"
                                    onClick={() => copyToClipboard(`${baseUrl}/api/transactional/send`)}
                                    title="Copy endpoint URL"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="api-params-section">
                            <h3>Request Parameters</h3>
                            <div className="api-params-table-container">
                                <table className="api-params-table">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Type</th>
                                            <th>Required</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>apiKey</td>
                                            <td>String</td>
                                            <td>Yes</td>
                                            <td>Your template API key</td>
                                        </tr>
                                        <tr>
                                            <td>to</td>
                                            <td>String</td>
                                            <td>Yes</td>
                                            <td>Recipient email address</td>
                                        </tr>
                                        <tr>
                                            <td>variables</td>
                                            <td>Object</td>
                                            <td>No</td>
                                            <td>Variables to replace in the template</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {template?.variables && template.variables.length > 0 && (
                            <div className="template-variables-section">
                                <h3>Template Variables</h3>
                                <div className="template-variables-table-container">
                                    <table className="template-variables-table">
                                        <thead>
                                            <tr>
                                                <th>Variable</th>
                                                <th>Required</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {template.variables.map((variable) => (
                                                <tr key={variable.name}>
                                                    <td>
                                                        <code>[{variable.name}]</code>
                                                    </td>
                                                    <td>{variable.required ? 'Yes' : 'No'}</td>
                                                    <td>{variable.description || `Variable for ${variable.name}`}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="code-examples-section">
                            <h3>Code Examples</h3>

                            <div className="code-tab-container">
                                <div className="code-tabs">
                                    <button
                                        className={`code-tab ${activeTab === 'curl' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('curl')}
                                    >
                                        cURL
                                    </button>
                                    <button
                                        className={`code-tab ${activeTab === 'node' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('node')}
                                    >
                                        Node.js
                                    </button>
                                    <button
                                        className={`code-tab ${activeTab === 'python' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('python')}
                                    >
                                        Python
                                    </button>
                                </div>

                                <div className="code-examples">
                                    <div className={`code-example ${activeTab === 'curl' ? 'active' : ''}`}>
                                        <div className="code-header">
                                            <span>cURL</span>
                                            <button
                                                className="copy-button"
                                                onClick={() => copyToClipboard(generateCurlExample())}
                                                title="Copy code"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <pre className="code-block">
                                            <code>{generateCurlExample()}</code>
                                        </pre>
                                    </div>

                                    <div className={`code-example ${activeTab === 'node' ? 'active' : ''}`}>
                                        <div className="code-header">
                                            <span>Node.js</span>
                                            <button
                                                className="copy-button"
                                                onClick={() => copyToClipboard(generateNodeExample())}
                                                title="Copy code"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <pre className="code-block">
                                            <code>{generateNodeExample()}</code>
                                        </pre>
                                    </div>

                                    <div className={`code-example ${activeTab === 'python' ? 'active' : ''}`}>
                                        <div className="code-header">
                                            <span>Python</span>
                                            <button
                                                className="copy-button"
                                                onClick={() => copyToClipboard(generatePythonExample())}
                                                title="Copy code"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <pre className="code-block">
                                            <code>{generatePythonExample()}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="response-section">
                            <h3>Response Format</h3>
                            <div className="response-examples">
                                <div className="response-example">
                                    <h4>Success Response (200 OK)</h4>
                                    <pre className="code-block">
                                        <code>{`{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "example-message-id-123456"
}`}</code>
                                    </pre>
                                </div>

                                <div className="response-example">
                                    <h4>Error Response (4XX/5XX)</h4>
                                    <pre className="code-block">
                                        <code>{`{
  "success": false,
  "message": "Error message explaining what went wrong"
}`}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="api-notes-section">
                            <h3>Important Notes</h3>
                            <ul className="api-notes-list">
                                <li>
                                    <strong>Rate Limits:</strong> The API is rate-limited to 100 emails per minute per brand.
                                </li>
                                <li>
                                    <strong>Email Tracking:</strong> Opens and clicks are automatically tracked for analytics.
                                </li>
                                <li>
                                    <strong>Variables:</strong> All variables defined in your template must be provided in the request if marked as required.
                                </li>
                                <li>
                                    <strong>Email Content:</strong> The content of your email is defined by the template and cannot be changed via API.
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </BrandLayout>
    );
}
