import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStableSession } from '@/lib/session';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { Shield, ArrowLeft, Check, Key, Globe, User, Info, ArrowRight, AlertCircle, CheckCircle, Loader, Copy, RefreshCw } from 'lucide-react';

export default function BrandVerification() {
    const { data: session, status } = useStableSession();
    const router = useRouter();
    const { id } = router.query;

    const [brand, setBrand] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Verification steps
    const [currentStep, setCurrentStep] = useState(1);
    const [isVerifying, setIsVerifying] = useState(false);

    // Step 1: AWS SES Credentials
    const [awsRegion, setAwsRegion] = useState('');
    const [awsAccessKey, setAwsAccessKey] = useState('');
    const [awsSecretKey, setAwsSecretKey] = useState('');
    const [step1Complete, setStep1Complete] = useState(false);

    // Step 2: Domain Verification
    const [domain, setDomain] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [domainVerified, setDomainVerified] = useState(false);
    const [dkimVerified, setDkimVerified] = useState(false);
    const [verificationToken, setVerificationToken] = useState('');
    const [dkimTokens, setDkimTokens] = useState([]);
    const [step2Complete, setStep2Complete] = useState(false);

    // Step 3: Sender Details
    const [fromName, setFromName] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [replyToEmail, setReplyToEmail] = useState('');
    const [step3Complete, setStep3Complete] = useState(false);

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
        // If brand data is loaded, pre-fill form fields and determine current step
        if (brand) {
            // Pre-fill AWS credentials
            if (brand.awsRegion) setAwsRegion(brand.awsRegion);
            if (brand.awsAccessKey) setAwsAccessKey(brand.awsAccessKey);
            if (brand.awsSecretKey) setAwsSecretKey('••••••••••••••••');

            // Pre-fill domain and sender details
            if (brand.sendingDomain) {
                setDomain(brand.sendingDomain);
                // Check domain verification status
                checkDomainVerificationStatus(brand.sendingDomain);
            }

            if (brand.fromName) setFromName(brand.fromName);
            if (brand.fromEmail) setFromEmail(brand.fromEmail);
            if (brand.replyToEmail) setReplyToEmail(brand.replyToEmail);

            // Determine completion status of each step
            if (brand.awsRegion && brand.awsAccessKey) {
                setStep1Complete(true);

                if (brand.sendingDomain) {
                    setVerificationSent(true);

                    if (brand.status === 'active' || (brand.fromName && brand.replyToEmail)) {
                        setStep2Complete(true);

                        if (brand.fromName && brand.fromEmail && brand.replyToEmail) {
                            setStep3Complete(true);
                        }
                    }
                }
            }

            // Set current step based on brand status
            if (brand.status === 'pending_setup') {
                if (!step1Complete) setCurrentStep(1);
                else if (!step2Complete) setCurrentStep(2);
                else if (!step3Complete) setCurrentStep(3);
            } else if (brand.status === 'pending_verification') {
                setCurrentStep(2); // Usually waiting for domain verification
            } else if (brand.status === 'active') {
                // All steps are complete, show summary
                setStep1Complete(true);
                setStep2Complete(true);
                setStep3Complete(true);
            }
        }
    }, [brand]);

    const fetchBrandDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}?includeSecrets=true`, {
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
        } finally {
            setIsLoading(false);
        }
    };

    const checkDomainVerificationStatus = async (domainToCheck) => {
        try {
            const res = await fetch(`/api/brands/${id}/verification/check-domain?domain=${encodeURIComponent(domainToCheck)}`, {
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to check domain verification status');
            }

            const data = await res.json();

            setDomainVerified(data.domainVerified);
            setDkimVerified(data.dkimVerified);
            setVerificationToken(data.verificationToken);
            setDkimTokens(data.dkimTokens || []);

            if (data.domainVerified && data.dkimVerified) {
                setStep2Complete(true);
            }

            return data;
        } catch (error) {
            console.error('Error checking domain verification:', error);
            // We don't show this error to avoid cluttering the UI
            return null;
        }
    };

    const handleSaveAwsCredentials = async (e) => {
        e.preventDefault();

        if (!awsRegion || !awsAccessKey || !awsSecretKey) {
            setError('Please fill in all AWS SES credentials fields');
            return;
        }

        setIsVerifying(true);
        setError('');
        setSuccess('');

        try {
            // Only send the secret key if it's not masked
            const payload = {
                awsRegion,
                awsAccessKey,
                awsSecretKey: awsSecretKey === '••••••••••••••••' ? undefined : awsSecretKey,
            };

            const res = await fetch(`/api/brands/${id}/verification/aws-credentials`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save AWS credentials');
            }

            setSuccess('AWS credentials saved successfully');
            setStep1Complete(true);

            // Update local brand data
            fetchBrandDetails();

            // Move to next step after a short delay
            setTimeout(() => {
                setCurrentStep(2);
                setSuccess('');
            }, 1500);
        } catch (error) {
            console.error('Error saving AWS credentials:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyDomain = async (e) => {
        e.preventDefault();

        if (!domain) {
            setError('Please enter the domain you want to verify');
            return;
        }

        // Basic domain validation
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
        if (!domainRegex.test(domain)) {
            setError('Please enter a valid domain (e.g., yourdomain.com)');
            return;
        }

        setIsVerifying(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/brands/${id}/verification/verify-domain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ domain }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to initiate domain verification');
            }

            const data = await res.json();
            setVerificationToken(data.verificationToken);
            setDkimTokens(data.dkimTokens || []);
            setSuccess('Domain verification initiated. Please add the DNS records to your domain.');
            setVerificationSent(true);

            // Update the brand
            await fetch(`/api/brands/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sendingDomain: domain }),
                credentials: 'same-origin',
            });

            // Update local brand data
            fetchBrandDetails();
        } catch (error) {
            console.error('Error initiating domain verification:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCheckVerification = async () => {
        setIsVerifying(true);
        setError('');
        setSuccess('');

        try {
            const data = await checkDomainVerificationStatus(domain);

            if (!data) {
                throw new Error('Failed to fetch verification status');
            }

            if (data.domainVerified && data.dkimVerified) {
                setSuccess('Domain verified successfully!');

                // Update brand status to active
                await fetch(`/api/brands/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: 'active' }),
                    credentials: 'same-origin',
                });

                // Move to next step after a short delay
                setTimeout(() => {
                    setCurrentStep(3);
                    setSuccess('');
                }, 1500);
            } else {
                let message = '';

                if (!data.domainVerified) {
                    message += 'Domain verification is pending. ';
                }

                if (!data.dkimVerified) {
                    message += 'DKIM verification is pending. ';
                }

                message += 'Please make sure DNS records are added correctly.';
                setError(message);
            }
        } catch (error) {
            console.error('Error checking verification:', error);
            setError(error.message || 'Failed to check verification status');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSaveSenderDetails = async (e) => {
        e.preventDefault();

        if (!fromName || !fromEmail || !replyToEmail) {
            setError('Please fill in all sender details fields');
            return;
        }

        // Basic email validation for both email fields
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(fromEmail)) {
            setError('Please enter a valid sender email address');
            return;
        }

        if (!emailPattern.test(replyToEmail)) {
            setError('Please enter a valid reply-to email address');
            return;
        }

        // Validate that email domains match the verified domain
        const fromEmailDomain = fromEmail.split('@')[1];

        if (fromEmailDomain !== domain) {
            setError(`Sender email must use your verified domain: ${domain}`);
            return;
        }

        setIsVerifying(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/brands/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromName,
                    fromEmail,
                    replyToEmail,
                    status: 'active', // Update status to active since all verification is complete
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save sender details');
            }

            setSuccess('Sender details saved successfully! Your brand is now verified and ready to send campaigns.');
            setStep3Complete(true);

            // Update local brand data
            fetchBrandDetails();
        } catch (error) {
            console.error('Error saving sender details:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsVerifying(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccess('Copied to clipboard!');

        // Clear success message after 2 seconds
        setTimeout(() => {
            setSuccess('');
        }, 2000);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="verification-step">
                        <div className="step-header">
                            <div className="step-icon">
                                <Key size={20} />
                            </div>
                            <h2>Step 1: Configure AWS SES</h2>
                        </div>

                        <div className="step-content">
                            <p className="step-description">To send emails, we need your Amazon SES (Simple Email Service) credentials. These will be used to send your campaigns through your own AWS account.</p>

                            <div className="info-box">
                                <Info size={18} />
                                <div>
                                    <p>
                                        <strong>How to get your AWS SES credentials:</strong>
                                    </p>
                                    <ol>
                                        <li>Log in to your AWS Management Console</li>
                                        <li>Navigate to IAM (Identity and Access Management)</li>
                                        <li>Create a new user with programmatic access</li>
                                        <li>Attach the "AmazonSESFullAccess" policy to this user</li>
                                        <li>Save the Access Key ID and Secret Access Key provided</li>
                                    </ol>
                                    <p>
                                        <a
                                            href="https://docs.aws.amazon.com/ses/latest/dg/setting-up.html"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Learn more in the AWS documentation
                                        </a>
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={handleSaveAwsCredentials}
                                className="verification-form"
                            >
                                <div className="form-group">
                                    <label htmlFor="awsRegion">AWS Region</label>
                                    <select
                                        id="awsRegion"
                                        value={awsRegion}
                                        onChange={(e) => setAwsRegion(e.target.value)}
                                        disabled={isVerifying}
                                    >
                                        <option value="">Select a region</option>
                                        <option value="us-east-1">US East (N. Virginia)</option>
                                        <option value="us-east-2">US East (Ohio)</option>
                                        <option value="us-west-1">US West (N. California)</option>
                                        <option value="us-west-2">US West (Oregon)</option>
                                        <option value="ca-central-1">Canada (Central)</option>
                                        <option value="eu-west-1">EU (Ireland)</option>
                                        <option value="eu-central-1">EU (Frankfurt)</option>
                                        <option value="eu-west-2">EU (London)</option>
                                        <option value="eu-west-3">EU (Paris)</option>
                                        <option value="eu-north-1">EU (Stockholm)</option>
                                        <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                                        <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                                        <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                                        <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                                        <option value="sa-east-1">South America (São Paulo)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="awsAccessKey">AWS Access Key ID</label>
                                    <input
                                        type="text"
                                        id="awsAccessKey"
                                        value={awsAccessKey}
                                        onChange={(e) => setAwsAccessKey(e.target.value)}
                                        placeholder="AKIAIOSFODNN7EXAMPLE"
                                        disabled={isVerifying}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="awsSecretKey">AWS Secret Access Key</label>
                                    <input
                                        type="password"
                                        id="awsSecretKey"
                                        value={awsSecretKey}
                                        onChange={(e) => setAwsSecretKey(e.target.value)}
                                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                        disabled={isVerifying}
                                    />
                                    <p className="hint-text">Your secret key will be encrypted and stored securely.</p>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isVerifying}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader
                                                    size={16}
                                                    className="spinner"
                                                />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                Save & Continue
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="verification-step">
                        <div className="step-header">
                            <div className="step-icon">
                                <Globe size={20} />
                            </div>
                            <h2>Step 2: Verify Domain</h2>
                        </div>

                        <div className="step-content">
                            <p className="step-description">To comply with email sending best practices and achieve better deliverability, you need to verify a domain with Amazon SES. This will allow you to send emails from any address at this domain.</p>

                            {!verificationSent ? (
                                <form
                                    onSubmit={handleVerifyDomain}
                                    className="verification-form"
                                >
                                    <div className="form-group">
                                        <label htmlFor="domain">Domain Name</label>
                                        <input
                                            type="text"
                                            id="domain"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            placeholder="yourdomain.com"
                                            disabled={isVerifying}
                                        />
                                        <p className="hint-text">Enter a domain that you control, without the 'www' prefix (e.g., yourdomain.com).</p>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={isVerifying}
                                        >
                                            {isVerifying ? (
                                                <>
                                                    <Loader
                                                        size={16}
                                                        className="spinner"
                                                    />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <Globe size={16} />
                                                    Verify Domain
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="dns-verification-container">
                                        <div className="verification-status-info">
                                            <h3>DNS Verification Status</h3>
                                            <div className="status-indicators">
                                                <div className={`status-indicator ${domainVerified ? 'verified' : 'pending'}`}>
                                                    <div className="indicator-icon">{domainVerified ? <CheckCircle size={18} /> : <AlertCircle size={18} />}</div>
                                                    <div className="indicator-label">
                                                        <span className="label">Domain Verification:</span>
                                                        <span className="status">{domainVerified ? 'Verified' : 'Pending'}</span>
                                                    </div>
                                                </div>
                                                <div className={`status-indicator ${dkimVerified ? 'verified' : 'pending'}`}>
                                                    <div className="indicator-icon">{dkimVerified ? <CheckCircle size={18} /> : <AlertCircle size={18} />}</div>
                                                    <div className="indicator-label">
                                                        <span className="label">DKIM Verification:</span>
                                                        <span className="status">{dkimVerified ? 'Verified' : 'Pending'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="dns-records">
                                            <div className="record-title">
                                                <h4>Domain Verification Record (TXT)</h4>
                                            </div>
                                            <div className="record-item">
                                                <div className="record-type">TXT</div>
                                                <div className="record-host">_amazonses.{domain}</div>
                                                <div className="record-value">{verificationToken}</div>
                                                <button
                                                    className="btn-copy"
                                                    onClick={() => copyToClipboard(verificationToken)}
                                                    title="Copy to clipboard"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="dns-records">
                                            <div className="record-title">
                                                <h4>DKIM Verification Records (CNAME)</h4>
                                            </div>
                                            {dkimTokens && dkimTokens.length > 0 ? (
                                                dkimTokens.map((token, index) => (
                                                    <div
                                                        className="record-item"
                                                        key={index}
                                                    >
                                                        <div className="record-type">CNAME</div>
                                                        <div className="record-host">
                                                            {token}._domainkey.{domain}
                                                        </div>
                                                        <div className="record-value">{token}.dkim.amazonses.com</div>
                                                        <button
                                                            className="btn-copy"
                                                            onClick={() => copyToClipboard(`${token}.dkim.amazonses.com`)}
                                                            title="Copy to clipboard"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="record-empty">
                                                    <p>No DKIM tokens available. This may be due to a region where DKIM is not automatically enabled.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="info-box">
                                            <Info size={18} />
                                            <div>
                                                <p>
                                                    <strong>How to add these DNS records:</strong>
                                                </p>
                                                <ol>
                                                    <li>Log in to your domain registrar or DNS provider (e.g., GoDaddy, Cloudflare, Route 53)</li>
                                                    <li>Navigate to the DNS management section for your domain</li>
                                                    <li>Add all the records listed above with their exact values</li>
                                                    <li>DNS changes can take up to 72 hours to propagate, though they often take effect within a few hours</li>
                                                </ol>
                                                <p>
                                                    <strong>Note:</strong> DNS providers may have different interfaces for adding records. Consult your provider's documentation if needed.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="verification-actions">
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={handleCheckVerification}
                                                disabled={isVerifying}
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <Loader
                                                            size={16}
                                                            className="spinner"
                                                        />
                                                        Checking...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw size={16} />
                                                        Check Verification Status
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {domainVerified && dkimVerified && (
                                        <div className="verification-success-container">
                                            <div className="verification-success">
                                                <CheckCircle size={20} />
                                                <span>Domain verification complete!</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={() => setCurrentStep(3)}
                                            >
                                                Continue to Next Step
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );

            // Case 3 section
            case 3:
                return (
                    <div className="verification-step">
                        <div className="step-header">
                            <div className="step-icon">
                                <User size={20} />
                            </div>
                            <h2>Step 3: Configure Sender Details</h2>
                        </div>

                        <div className="step-content">
                            <p className="step-description">Configure how your recipients will see your emails. These details will be displayed in their inbox and will help them recognize your messages.</p>

                            <form
                                onSubmit={handleSaveSenderDetails}
                                className="verification-form"
                            >
                                <div className="form-group">
                                    <label htmlFor="fromName">Sender Name</label>
                                    <input
                                        type="text"
                                        id="fromName"
                                        value={fromName}
                                        onChange={(e) => setFromName(e.target.value)}
                                        placeholder="Company Name or Your Name"
                                        disabled={isVerifying}
                                    />
                                    <p className="hint-text">This name will appear as the sender name in recipients' inboxes.</p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="fromEmail">Sender Email Address</label>
                                    <div className="domain-input-wrapper">
                                        <input
                                            type="text"
                                            id="fromEmail"
                                            value={fromEmail.split('@')[0] || ''}
                                            onChange={(e) => setFromEmail(`${e.target.value}@${domain}`)}
                                            placeholder="noreply"
                                            disabled={isVerifying}
                                        />
                                        <span className="domain-suffix">@{domain}</span>
                                    </div>
                                    <p className="hint-text">This is the email address that will appear in the "From" field of your campaigns.</p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="replyToEmail">Reply-To Email Address</label>
                                    <input
                                        type="email"
                                        id="replyToEmail"
                                        value={replyToEmail}
                                        onChange={(e) => setReplyToEmail(e.target.value)}
                                        placeholder={`support@${domain}`}
                                        disabled={isVerifying}
                                    />
                                    <p className="hint-text">If recipients reply to your campaigns, their emails will go to this address.</p>
                                </div>

                                <div className="info-box">
                                    <Info size={18} />
                                    <div>
                                        <p>
                                            <strong>Important notes about sender details:</strong>
                                        </p>
                                        <ul>
                                            <li>Your sender email must use your verified domain ({domain})</li>
                                            <li>Choose a clear and recognizable sender name to improve open rates</li>
                                            <li>The reply-to email can be any valid email address you have access to</li>
                                            <li>Using a functional reply-to address (e.g., support@yourdomain.com) allows customers to respond to your campaigns</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isVerifying}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader
                                                    size={16}
                                                    className="spinner"
                                                />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} />
                                                Complete Verification
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            default:
                return <div>Unknown step</div>;
        }
    };

    const renderStepIndicator = () => {
        return (
            <div className="steps-indicator">
                <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${step1Complete ? 'completed' : ''}`}>
                    <div className="step-number">{step1Complete ? <Check size={16} /> : '1'}</div>
                    <div className="step-label">AWS SES Setup</div>
                </div>

                <div className="step-connector"></div>

                <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${step2Complete ? 'completed' : ''}`}>
                    <div className="step-number">{step2Complete ? <Check size={16} /> : '2'}</div>
                    <div className="step-label">Verify Domain</div>
                </div>

                <div className="step-connector"></div>

                <div className={`step-item ${currentStep >= 3 ? 'active' : ''} ${step3Complete ? 'completed' : ''}`}>
                    <div className="step-number">{step3Complete ? <Check size={16} /> : '3'}</div>
                    <div className="step-label">Sender Details</div>
                </div>
            </div>
        );
    };

    if (isLoading || !brand) {
        return (
            <BrandLayout brand={null}>
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>Loading verification settings...</p>
                </div>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="verification-container">
                <div className="verification-header">
                    <Link
                        href={`/brands/${id}`}
                        className="back-link"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to brand</span>
                    </Link>

                    <h1>
                        <Shield size={20} />
                        <span>Brand Verification</span>
                    </h1>

                    <div className="verification-status">
                        <div className={`status-badge ${brand.status === 'active' ? 'verified' : 'pending'}`}>
                            {brand.status === 'active' ? (
                                <>
                                    <Check size={14} />
                                    <span>Verified</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={14} />
                                    <span>{brand.status === 'pending_setup' ? 'Setup Needed' : 'Verification Pending'}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert success">
                        <CheckCircle size={16} />
                        <span>{success}</span>
                    </div>
                )}

                {renderStepIndicator()}

                <div className="verification-content">{renderStep()}</div>
            </div>
        </BrandLayout>
    );
}
