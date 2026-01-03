import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Loader, CheckCircle, AlertCircle, ArrowRight, Users } from 'lucide-react';

export default function AcceptInvite() {
    const router = useRouter();
    const { token } = router.query;

    const [isVerifying, setIsVerifying] = useState(true);
    const [invitation, setInvitation] = useState(null);
    const [error, setError] = useState('');

    // Form state (for new users)
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) return;
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const res = await fetch(`/api/invite/verify?token=${token}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            setInvitation(data);
        } catch (err) {
            setError(err.message || 'Invalid invitation link');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation for new users
        if (!invitation.userExists) {
            if (!name.trim()) {
                setError('Name is required');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/invite/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    name: invitation.userExists ? undefined : name,
                    password: invitation.userExists ? undefined : password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            setSuccess(true);

            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isVerifying) {
        return (
            <>
                <Head>
                    <title>Accept Invitation - Maillayer</title>
                </Head>
                <div className="auth-page">
                    <div className="auth-bg">
                        <div className="gradient-orb gradient-orb-1"></div>
                        <div className="gradient-orb gradient-orb-2"></div>
                    </div>
                    <div className="auth-container">
                        <div className="auth-card">
                            <div className="auth-logo">
                                <img src="https://c1.tablecdn.com/maillayer/logo.png" alt="Maillayer" className="auth-logo-img" />
                            </div>
                            <div className="auth-header">
                                <h1>Verifying Invitation</h1>
                                <p>Please wait...</p>
                            </div>
                            <div className="auth-loading">
                                <Loader size={24} className="spin" />
                            </div>
                        </div>
                    </div>
                </div>
                <style jsx>{styles}</style>
            </>
        );
    }

    // Error state (invalid/expired token)
    if (error && !invitation) {
        return (
            <>
                <Head>
                    <title>Invalid Invitation - Maillayer</title>
                </Head>
                <div className="auth-page">
                    <div className="auth-bg">
                        <div className="gradient-orb gradient-orb-1"></div>
                        <div className="gradient-orb gradient-orb-2"></div>
                    </div>
                    <div className="auth-container">
                        <div className="auth-card">
                            <div className="auth-logo">
                                <img src="https://c1.tablecdn.com/maillayer/logo.png" alt="Maillayer" className="auth-logo-img" />
                            </div>
                            <div className="error-icon">
                                <AlertCircle size={32} />
                            </div>
                            <div className="auth-header">
                                <h1>Invalid Invitation</h1>
                                <p>{error}</p>
                            </div>
                            <Link href="/login" className="auth-submit">
                                Go to Login
                            </Link>
                        </div>
                    </div>
                </div>
                <style jsx>{styles}</style>
            </>
        );
    }

    // Success state
    if (success) {
        return (
            <>
                <Head>
                    <title>Invitation Accepted - Maillayer</title>
                </Head>
                <div className="auth-page">
                    <div className="auth-bg">
                        <div className="gradient-orb gradient-orb-1"></div>
                        <div className="gradient-orb gradient-orb-2"></div>
                    </div>
                    <div className="auth-container">
                        <div className="auth-card">
                            <div className="auth-logo">
                                <img src="https://c1.tablecdn.com/maillayer/logo.png" alt="Maillayer" className="auth-logo-img" />
                            </div>
                            <div className="success-icon">
                                <CheckCircle size={32} />
                            </div>
                            <div className="auth-header">
                                <h1>Welcome to {invitation.brandName}!</h1>
                                <p>Your invitation has been accepted. Redirecting to login...</p>
                            </div>
                            <div className="auth-loading">
                                <Loader size={20} className="spin" />
                            </div>
                        </div>
                    </div>
                </div>
                <style jsx>{styles}</style>
            </>
        );
    }

    // Main form
    return (
        <>
            <Head>
                <title>Accept Invitation - Maillayer</title>
            </Head>
            <div className="auth-page">
                <div className="auth-bg">
                    <div className="gradient-orb gradient-orb-1"></div>
                    <div className="gradient-orb gradient-orb-2"></div>
                </div>

                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-logo">
                            <img src="https://c1.tablecdn.com/maillayer/logo.png" alt="Maillayer" className="auth-logo-img" />
                        </div>

                        <div className="invite-badge">
                            <Users size={14} />
                            <span>Team Invitation</span>
                        </div>

                        <div className="auth-header">
                            <h1>Join {invitation.brandName}</h1>
                            <p>
                                You&apos;ve been invited as a <strong>{invitation.role}</strong>
                            </p>
                        </div>

                        {error && (
                            <div className="auth-alert auth-alert-error">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={invitation.email}
                                    disabled
                                    className="disabled"
                                />
                            </div>

                            {!invitation.userExists && (
                                <>
                                    <div className="form-group">
                                        <label>Your Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {invitation.userExists && (
                                <div className="info-box">
                                    <p>
                                        You already have an account. Click below to accept
                                        the invitation and get access to this brand.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader size={16} className="spin" />
                                        <span>{invitation.userExists ? 'Accepting...' : 'Creating Account...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{invitation.userExists ? 'Accept Invitation' : 'Create Account & Join'}</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <span>Already have access?</span>
                            <Link href="/login">Sign in</Link>
                        </div>
                    </div>

                    <p className="auth-tagline">Email Marketing Platform</p>
                </div>
            </div>
            <style jsx>{styles}</style>
        </>
    );
}

const styles = `
    .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        position: relative;
        overflow: hidden;
        padding: 24px;
    }

    .auth-bg {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .gradient-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.12;
    }

    .gradient-orb-1 {
        width: 500px;
        height: 500px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        top: -150px;
        right: -100px;
    }

    .gradient-orb-2 {
        width: 400px;
        height: 400px;
        background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
        bottom: -100px;
        left: -50px;
    }

    .auth-container {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .auth-card {
        width: 100%;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 40px 32px;
    }

    .auth-logo {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
    }

    .auth-logo :global(.auth-logo-img) {
        height: 28px !important;
        max-height: 28px !important;
        width: auto !important;
        display: block;
    }

    .invite-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(99, 102, 241, 0.15);
        border-radius: 20px;
        color: #818cf8;
        font-size: 12px;
        font-weight: 500;
        margin: 0 auto 16px;
        width: fit-content;
        display: flex;
    }

    .auth-header {
        text-align: center;
        margin-bottom: 28px;
    }

    .auth-header h1 {
        font-size: 24px;
        font-weight: 600;
        color: #fafafa;
        margin: 0 0 8px;
        letter-spacing: -0.3px;
    }

    .auth-header p {
        font-size: 14px;
        color: #71717a;
        margin: 0;
    }

    .auth-header p strong {
        color: #a1a1aa;
        text-transform: capitalize;
    }

    .auth-loading {
        display: flex;
        justify-content: center;
        padding: 20px 0;
        color: #71717a;
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

    .error-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        margin: 0 auto 16px;
        background: rgba(239, 68, 68, 0.15);
        border-radius: 50%;
        color: #ef4444;
    }

    .auth-alert {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 20px;
    }

    .auth-alert-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }

    .auth-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-group label {
        font-size: 13px;
        font-weight: 500;
        color: #a1a1aa;
    }

    .form-group input {
        width: 100%;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        color: #fafafa;
        font-size: 14px;
        transition: all 0.15s;
        outline: none;
    }

    .form-group input:focus {
        border-color: rgba(99, 102, 241, 0.5);
        background: rgba(255, 255, 255, 0.05);
    }

    .form-group input::placeholder {
        color: #52525b;
    }

    .form-group input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.02);
    }

    .info-box {
        padding: 14px 16px;
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 8px;
    }

    .info-box p {
        margin: 0;
        font-size: 13px;
        color: #a1a1aa;
        line-height: 1.5;
    }

    .auth-submit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px 20px;
        background: #fafafa;
        border: none;
        border-radius: 8px;
        color: #0a0a0a;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
        margin-top: 4px;
        text-decoration: none;
    }

    .auth-submit:hover:not(:disabled) {
        background: #e4e4e7;
    }

    .auth-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .auth-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .auth-footer span {
        font-size: 13px;
        color: #71717a;
    }

    .auth-footer :global(a) {
        font-size: 13px;
        color: #6366f1;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.15s;
    }

    .auth-footer :global(a:hover) {
        color: #818cf8;
    }

    .auth-tagline {
        margin-top: 24px;
        font-size: 12px;
        color: #3f3f46;
        letter-spacing: 0.5px;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    :global(.spin) {
        animation: spin 1s linear infinite;
    }
`;
