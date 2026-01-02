import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLayout from '@/components/BrandLayout';
import { ArrowLeft, Check, AlertCircle, CheckCircle, Loader, Copy, RefreshCw, Shield } from 'lucide-react';
import { AWS_SES_REGIONS } from '@/constants/awsRegions';

export default function BrandVerification() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [brand, setBrand] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [copiedField, setCopiedField] = useState('');

    const [currentStep, setCurrentStep] = useState(1);
    const [emailProvider, setEmailProvider] = useState('ses');
    const [awsRegion, setAwsRegion] = useState('');
    const [awsAccessKey, setAwsAccessKey] = useState('');
    const [awsSecretKey, setAwsSecretKey] = useState('');
    const [sendgridApiKey, setSendgridApiKey] = useState('');
    const [mailgunApiKey, setMailgunApiKey] = useState('');
    const [mailgunDomain, setMailgunDomain] = useState('');
    const [mailgunRegion, setMailgunRegion] = useState('us');
    const [domain, setDomain] = useState('');
    const [fromName, setFromName] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [replyToEmail, setReplyToEmail] = useState('');

    const [verificationSent, setVerificationSent] = useState(false);
    const [domainVerified, setDomainVerified] = useState(false);
    const [dkimVerified, setDkimVerified] = useState(false);
    const [verificationToken, setVerificationToken] = useState('');
    const [dkimTokens, setDkimTokens] = useState([]);
    const [completedSteps, setCompletedSteps] = useState([]);

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
        if (brand) {
            const provider = brand.emailProvider || 'ses';
            if (brand.emailProvider) setEmailProvider(brand.emailProvider);
            if (brand.awsRegion) setAwsRegion(brand.awsRegion);
            if (brand.awsAccessKey) setAwsAccessKey(brand.awsAccessKey);
            if (brand.awsSecretKey) setAwsSecretKey('••••••••••••••••');
            if (brand.sendgridApiKey) setSendgridApiKey('••••••••••••••••');
            if (brand.mailgunApiKey) setMailgunApiKey('••••••••••••••••');
            if (brand.mailgunDomain) setMailgunDomain(brand.mailgunDomain);
            if (brand.mailgunRegion) setMailgunRegion(brand.mailgunRegion);
            if (brand.sendingDomain) {
                setDomain(brand.sendingDomain);
                if (provider === 'ses') {
                    checkDomainVerificationStatus(brand.sendingDomain);
                } else {
                    setDomainVerified(true);
                    setDkimVerified(true);
                }
            }
            if (brand.fromName) setFromName(brand.fromName);
            if (brand.fromEmail) setFromEmail(brand.fromEmail);
            if (brand.replyToEmail) setReplyToEmail(brand.replyToEmail);

            const completed = [];
            if (brand.emailProvider) completed.push(1);
            if (provider === 'ses' && brand.awsRegion && brand.awsAccessKey && brand.awsSecretKey) {
                completed.push(2);
                if (brand.sendingDomain) setVerificationSent(true);
            } else if (provider === 'sendgrid' && brand.sendgridApiKey) {
                completed.push(2);
            } else if (provider === 'mailgun' && brand.mailgunApiKey && brand.mailgunDomain) {
                completed.push(2);
            }
            if (brand.sendingDomain && (brand.status === 'active' || provider !== 'ses')) completed.push(3);
            if (brand.fromName && brand.fromEmail && brand.replyToEmail) completed.push(4);
            setCompletedSteps(completed);

            if (brand.status === 'active') {
                setCurrentStep(4);
                setCompletedSteps([1, 2, 3, 4]);
            } else if (!completed.includes(1)) setCurrentStep(1);
            else if (!completed.includes(2)) setCurrentStep(2);
            else if (!completed.includes(3)) setCurrentStep(3);
            else setCurrentStep(4);
        }
    }, [brand]);

    const fetchBrandDetails = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/brands/${id}?includeSecrets=true`, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('Failed to fetch brand details');
            setBrand(await res.json());
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkDomainVerificationStatus = async (d) => {
        try {
            const res = await fetch(`/api/brands/${id}/verification/check-domain?domain=${encodeURIComponent(d)}`, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('Failed to check domain');
            const data = await res.json();
            setDomainVerified(data.domainVerified);
            setDkimVerified(data.dkimVerified);
            setVerificationToken(data.verificationToken);
            setDkimTokens(data.dkimTokens || []);
            return data;
        } catch { return null; }
    };

    const copyToClipboard = async (text, fieldId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldId);
            setTimeout(() => setCopiedField(''), 2000);
        } catch {}
    };

    const handleStep1 = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');
        try {
            const res = await fetch(`/api/brands/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailProvider }),
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to save provider');
            setCompletedSteps(prev => [...prev.filter(s => s !== 1), 1]);
            setCurrentStep(2);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleStep2 = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');
        try {
            let endpoint = '', payload = {};
            if (emailProvider === 'ses') {
                if (!awsRegion || !awsAccessKey || !awsSecretKey) throw new Error('All fields required');
                endpoint = `/api/brands/${id}/verification/aws-credentials`;
                payload = { awsRegion, awsAccessKey, awsSecretKey: awsSecretKey === '••••••••••••••••' ? undefined : awsSecretKey };
            } else if (emailProvider === 'sendgrid') {
                if (!sendgridApiKey) throw new Error('API key required');
                endpoint = `/api/brands/${id}/verification/sendgrid-credentials`;
                payload = { sendgridApiKey: sendgridApiKey === '••••••••••••••••' ? undefined : sendgridApiKey };
            } else if (emailProvider === 'mailgun') {
                if (!mailgunApiKey || !mailgunDomain) throw new Error('API key and domain required');
                endpoint = `/api/brands/${id}/verification/mailgun-credentials`;
                payload = { mailgunApiKey: mailgunApiKey === '••••••••••••••••' ? undefined : mailgunApiKey, mailgunDomain, mailgunRegion };
            }
            const res = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save');
            if (emailProvider === 'mailgun') setDomain(mailgunDomain);
            setCompletedSteps(prev => [...prev.filter(s => s !== 2), 2]);
            setCurrentStep(3);
            fetchBrandDetails();
        } catch (error) {
            setError(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleStep3 = async (e) => {
        e.preventDefault();
        if (!domain) { setError('Domain required'); return; }
        if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(domain)) { setError('Invalid domain'); return; }
        setIsVerifying(true);
        setError('');
        try {
            if (emailProvider === 'ses') {
                const res = await fetch(`/api/brands/${id}/verification/verify-domain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }), credentials: 'same-origin' });
                if (!res.ok) throw new Error('Failed to verify domain');
                const data = await res.json();
                setVerificationToken(data.verificationToken);
                setDkimTokens(data.dkimTokens || []);
                setVerificationSent(true);
            } else {
                setDomainVerified(true);
                setDkimVerified(true);
                setCompletedSteps(prev => [...prev.filter(s => s !== 3), 3]);
                setCurrentStep(4);
            }
            await fetch(`/api/brands/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sendingDomain: domain }), credentials: 'same-origin' });
            fetchBrandDetails();
        } catch (error) {
            setError(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCheckDNS = async () => {
        setIsVerifying(true);
        setError('');
        try {
            const data = await checkDomainVerificationStatus(domain);
            if (!data) throw new Error('Failed to check status');
            if (data.domainVerified && data.dkimVerified) {
                setSuccess('Domain verified!');
                await fetch(`/api/brands/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }), credentials: 'same-origin' });
                setCompletedSteps(prev => [...prev.filter(s => s !== 3), 3]);
                setTimeout(() => { setCurrentStep(4); setSuccess(''); }, 1500);
            } else {
                setError('DNS not verified yet. Wait and try again.');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleStep4 = async (e) => {
        e.preventDefault();
        if (!fromName || !fromEmail || !replyToEmail) { setError('All fields required'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToEmail)) { setError('Invalid email'); return; }
        if (fromEmail.split('@')[1] !== domain) { setError(`Use ${domain} domain`); return; }
        setIsVerifying(true);
        setError('');
        try {
            const res = await fetch(`/api/brands/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromName, fromEmail, replyToEmail, status: 'active' }), credentials: 'same-origin' });
            if (!res.ok) throw new Error('Failed to save');
            setSuccess('Setup complete!');
            setCompletedSteps(prev => [...prev.filter(s => s !== 4), 4]);
            setTimeout(() => router.push(`/brands/${id}`), 1500);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const steps = [{ n: 1, l: 'Provider' }, { n: 2, l: 'Credentials' }, { n: 3, l: 'Domain' }, { n: 4, l: 'Sender' }];

    if (isLoading || !brand) {
        return (
            <BrandLayout brand={null}>
                <div className="loading"><div className="spinner"></div><p>Loading...</p></div>
                <style jsx>{`.loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #71717a; } .spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fafafa; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </BrandLayout>
        );
    }

    return (
        <BrandLayout brand={brand}>
            <div className="page">
                <div className="header">
                    <Link href={`/brands/${id}`} className="back"><ArrowLeft size={16} /> Back</Link>
                    <h1><Shield size={18} /> Verification</h1>
                </div>

                {error && <div className="alert error"><AlertCircle size={14} /><span>{error}</span><button onClick={() => setError('')}>×</button></div>}
                {success && <div className="alert success"><CheckCircle size={14} /><span>{success}</span></div>}

                <div className="steps">
                    {steps.map((s, i) => (
                        <div key={s.n} className="step-item">
                            <div className={`step-num ${currentStep === s.n ? 'active' : ''} ${completedSteps.includes(s.n) ? 'done' : ''}`} onClick={() => completedSteps.includes(s.n) && setCurrentStep(s.n)}>
                                {completedSteps.includes(s.n) ? <Check size={12} /> : s.n}
                            </div>
                            <span className={currentStep === s.n ? 'active' : ''}>{s.l}</span>
                            {i < 3 && <div className={`step-line ${completedSteps.includes(s.n) ? 'done' : ''}`} />}
                        </div>
                    ))}
                </div>

                <div className="card">
                    {currentStep === 1 && (
                        <form onSubmit={handleStep1}>
                            <h3>Select Provider</h3>
                            <div className="form-row">
                                <label>Email Provider</label>
                                <select value={emailProvider} onChange={(e) => setEmailProvider(e.target.value)} disabled={isVerifying}>
                                    <option value="ses">Amazon SES</option>
                                    <option value="sendgrid">SendGrid</option>
                                    <option value="mailgun">Mailgun</option>
                                </select>
                            </div>
                            <div className="form-footer">
                                <button type="submit" className="btn-primary" disabled={isVerifying}>
                                    {isVerifying ? <Loader size={14} className="spin" /> : null} Continue
                                </button>
                            </div>
                        </form>
                    )}

                    {currentStep === 2 && (
                        <form onSubmit={handleStep2}>
                            <h3>{emailProvider === 'ses' ? 'AWS SES' : emailProvider === 'sendgrid' ? 'SendGrid' : 'Mailgun'} Credentials</h3>
                            {emailProvider === 'ses' && (
                                <>
                                    <div className="form-row"><label>AWS Region</label><select value={awsRegion} onChange={(e) => setAwsRegion(e.target.value)} disabled={isVerifying}><option value="">Select region</option>{AWS_SES_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                                    <div className="form-row"><label>Access Key</label><input type="text" value={awsAccessKey} onChange={(e) => setAwsAccessKey(e.target.value)} placeholder="AKIA..." disabled={isVerifying} /></div>
                                    <div className="form-row"><label>Secret Key</label><input type="password" value={awsSecretKey} onChange={(e) => setAwsSecretKey(e.target.value)} placeholder="Secret key" disabled={isVerifying} /></div>
                                </>
                            )}
                            {emailProvider === 'sendgrid' && (
                                <div className="form-row"><label>API Key</label><input type="password" value={sendgridApiKey} onChange={(e) => setSendgridApiKey(e.target.value)} placeholder="SG.xxx" disabled={isVerifying} /><span className="hint">Get from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer">SendGrid</a></span></div>
                            )}
                            {emailProvider === 'mailgun' && (
                                <>
                                    <div className="form-row"><label>API Key</label><input type="password" value={mailgunApiKey} onChange={(e) => setMailgunApiKey(e.target.value)} placeholder="key-xxx" disabled={isVerifying} /><span className="hint">Get from <a href="https://app.mailgun.com/settings/api_security" target="_blank" rel="noopener noreferrer">Mailgun</a></span></div>
                                    <div className="form-grid">
                                        <div className="form-row"><label>Domain</label><input type="text" value={mailgunDomain} onChange={(e) => setMailgunDomain(e.target.value)} placeholder="mg.domain.com" disabled={isVerifying} /></div>
                                        <div className="form-row"><label>Region</label><select value={mailgunRegion} onChange={(e) => setMailgunRegion(e.target.value)} disabled={isVerifying}><option value="us">US</option><option value="eu">EU</option></select></div>
                                    </div>
                                </>
                            )}
                            <div className="form-footer">
                                <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)} disabled={isVerifying}><ArrowLeft size={14} /> Back</button>
                                <button type="submit" className="btn-primary" disabled={isVerifying}>{isVerifying ? <Loader size={14} className="spin" /> : null} Continue</button>
                            </div>
                        </form>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <h3>Domain Verification</h3>
                            {!verificationSent || emailProvider !== 'ses' ? (
                                <form onSubmit={handleStep3}>
                                    <div className="form-row"><label>Sending Domain</label><input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" disabled={isVerifying} />{emailProvider !== 'ses' && <span className="hint">Verify in {emailProvider === 'sendgrid' ? 'SendGrid' : 'Mailgun'} dashboard first</span>}</div>
                                    <div className="form-footer">
                                        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)} disabled={isVerifying}><ArrowLeft size={14} /> Back</button>
                                        <button type="submit" className="btn-primary" disabled={isVerifying}>{isVerifying ? <Loader size={14} className="spin" /> : null} {emailProvider === 'ses' ? 'Verify' : 'Continue'}</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="status-badges">
                                        <span className={`badge ${domainVerified ? 'verified' : 'pending'}`}>{domainVerified ? <CheckCircle size={12} /> : <AlertCircle size={12} />} Domain</span>
                                        <span className={`badge ${dkimVerified ? 'verified' : 'pending'}`}>{dkimVerified ? <CheckCircle size={12} /> : <AlertCircle size={12} />} DKIM</span>
                                    </div>
                                    <p className="dns-info">Add these DNS records:</p>
                                    <div className="dns-records">
                                        <div className="dns-record">
                                            <span className="dns-type">TXT</span>
                                            <div className="dns-content">
                                                <div className="dns-row"><span className="dns-label">Name</span><code>_amazonses.{domain}</code><button type="button" onClick={() => copyToClipboard(`_amazonses.${domain}`, 'txt-n')}>{copiedField === 'txt-n' ? <Check size={12} /> : <Copy size={12} />}</button></div>
                                                <div className="dns-row"><span className="dns-label">Value</span><code>{verificationToken}</code><button type="button" onClick={() => copyToClipboard(verificationToken, 'txt-v')}>{copiedField === 'txt-v' ? <Check size={12} /> : <Copy size={12} />}</button></div>
                                            </div>
                                        </div>
                                        {dkimTokens.map((t, i) => (
                                            <div key={i} className="dns-record">
                                                <span className="dns-type">CNAME</span>
                                                <div className="dns-content">
                                                    <div className="dns-row"><span className="dns-label">Name</span><code>{t}._domainkey.{domain}</code><button type="button" onClick={() => copyToClipboard(`${t}._domainkey.${domain}`, `cn-${i}`)}>{copiedField === `cn-${i}` ? <Check size={12} /> : <Copy size={12} />}</button></div>
                                                    <div className="dns-row"><span className="dns-label">Value</span><code>{t}.dkim.amazonses.com</code><button type="button" onClick={() => copyToClipboard(`${t}.dkim.amazonses.com`, `cv-${i}`)}>{copiedField === `cv-${i}` ? <Check size={12} /> : <Copy size={12} />}</button></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="form-footer">
                                        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)} disabled={isVerifying}><ArrowLeft size={14} /> Back</button>
                                        <button type="button" className="btn-primary" onClick={handleCheckDNS} disabled={isVerifying}>{isVerifying ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />} Check DNS</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <form onSubmit={handleStep4}>
                            <h3>Sender Details</h3>
                            <div className="form-row"><label>Sender Name</label><input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your Company" disabled={isVerifying} /></div>
                            <div className="form-row"><label>From Email</label><div className="input-suffix"><input type="text" value={fromEmail.split('@')[0] || ''} onChange={(e) => setFromEmail(`${e.target.value}@${domain}`)} placeholder="noreply" disabled={isVerifying} /><span>@{domain}</span></div></div>
                            <div className="form-row"><label>Reply-To</label><input type="email" value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)} placeholder={`support@${domain}`} disabled={isVerifying} /></div>
                            <div className="form-footer">
                                <button type="button" className="btn-secondary" onClick={() => setCurrentStep(3)} disabled={isVerifying}><ArrowLeft size={14} /> Back</button>
                                <button type="submit" className="btn-success" disabled={isVerifying}>{isVerifying ? <Loader size={14} className="spin" /> : <Check size={14} />} Complete</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style jsx>{`
                .page { max-width: 560px; margin: 0 auto; padding: 24px; }
                .header { margin-bottom: 20px; }
                .header h1 { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; color: #fafafa; margin: 0; }
                .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #71717a; margin-bottom: 12px; transition: color 0.15s; }
                .back:hover { color: #fafafa; }

                .alert { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
                .alert span { flex: 1; }
                .alert button { background: none; border: none; color: inherit; font-size: 16px; cursor: pointer; opacity: 0.7; padding: 0; }
                .alert button:hover { opacity: 1; }
                .alert.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
                .alert.success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; }

                .steps { display: flex; align-items: center; margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; }
                .step-item { display: flex; align-items: center; flex: 1; }
                .step-item:last-child { flex: 0; }
                .step-num { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 50%; font-size: 12px; font-weight: 600; color: #52525b; cursor: default; transition: all 0.15s; flex-shrink: 0; }
                .step-num.active { background: #fafafa; border-color: #fafafa; color: #0a0a0a; }
                .step-num.done { background: #22c55e; border-color: #22c55e; color: #fff; cursor: pointer; }
                .step-item span { font-size: 11px; color: #52525b; margin-left: 8px; white-space: nowrap; }
                .step-item span.active { color: #fafafa; }
                .step-line { flex: 1; height: 2px; background: rgba(255,255,255,0.08); margin: 0 10px; }
                .step-line.done { background: #22c55e; }

                .card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; }
                .card h3 { font-size: 14px; font-weight: 600; color: #fafafa; margin: 0 0 16px; }

                .form-row { margin-bottom: 14px; }
                .form-row label { display: block; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 6px; }
                .form-row input, .form-row select { width: 100%; padding: 9px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #fafafa; font-size: 13px; transition: all 0.15s; }
                .form-row select { appearance: none; -webkit-appearance: none; -moz-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; cursor: pointer; }
                .form-row input:focus, .form-row select:focus { outline: none; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
                .form-row input::placeholder { color: #52525b; }
                .form-row select option { background: #1c1c1c; }
                .form-row input:disabled, .form-row select:disabled { opacity: 0.6; cursor: not-allowed; }
                .hint { display: block; font-size: 12px; color: #52525b; margin-top: 4px; }
                .hint a { color: #6366f1; text-decoration: none; }
                .hint a:hover { text-decoration: underline; }

                .form-grid { display: grid; grid-template-columns: 1fr 100px; gap: 12px; }

                .input-suffix { display: flex; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; transition: all 0.15s; }
                .input-suffix input { flex: 1; border: none !important; background: transparent !important; border-radius: 0 !important; }
                .input-suffix input:focus { box-shadow: none !important; }
                .input-suffix span { padding: 9px 12px; font-size: 13px; color: #52525b; background: rgba(255,255,255,0.03); border-left: 1px solid rgba(255,255,255,0.08); white-space: nowrap; }
                .input-suffix:focus-within { border-color: rgba(255,255,255,0.2); }

                .form-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }

                .btn-primary, .btn-secondary, .btn-success { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; font-size: 13px; font-weight: 500; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
                .btn-primary { background: #fafafa; border: none; color: #0a0a0a; }
                .btn-primary:hover:not(:disabled) { background: #e4e4e7; }
                .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #a1a1aa; }
                .btn-secondary:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); color: #fafafa; }
                .btn-success { background: #22c55e; border: none; color: #fff; }
                .btn-success:hover:not(:disabled) { background: #16a34a; }
                .btn-primary:disabled, .btn-secondary:disabled, .btn-success:disabled { opacity: 0.6; cursor: not-allowed; }

                .status-badges { display: flex; gap: 10px; margin-bottom: 14px; }
                .badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; font-size: 12px; font-weight: 500; border-radius: 12px; }
                .badge.pending { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #f59e0b; }
                .badge.verified { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; }

                .dns-info { font-size: 13px; color: #a1a1aa; margin: 0 0 12px; }
                .dns-records { display: flex; flex-direction: column; gap: 10px; }
                .dns-record { display: flex; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; }
                .dns-type { width: 50px; height: 22px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border-radius: 4px; font-size: 10px; font-weight: 700; color: #fafafa; font-family: monospace; flex-shrink: 0; }
                .dns-content { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
                .dns-row { display: flex; align-items: flex-start; gap: 8px; }
                .dns-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #52525b; width: 40px; flex-shrink: 0; padding-top: 3px; }
                .dns-row code { flex: 1; font-size: 11px; color: #a1a1aa; font-family: monospace; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px; word-break: break-all; min-width: 0; }
                .dns-row button { padding: 4px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #71717a; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
                .dns-row button:hover { border-color: rgba(255,255,255,0.2); color: #fafafa; }

                :global(.spin) { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 480px) {
                    .page { padding: 16px; }
                    .form-grid { grid-template-columns: 1fr; }
                    .step-item span { display: none; }
                    .dns-record { flex-direction: column; }
                }
            `}</style>
        </BrandLayout>
    );
}
