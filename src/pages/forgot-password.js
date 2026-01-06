import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Loader, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setMessage('If your email exists in our system, you will receive password reset instructions shortly.');
            setEmail('');
        } catch (error) {
            console.error('Forgot password error:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Forgot Password - Maillayer</title>
                <meta
                    name="description"
                    content="Reset your password"
                />
            </Head>

            <div className="auth-page">
                {/* Background effects */}
                <div className="auth-bg">
                    <div className="gradient-orb gradient-orb-1"></div>
                    <div className="gradient-orb gradient-orb-2"></div>
                </div>

                <div className="auth-container">
                    <div className="auth-card">
                        {/* Logo */}
                        <div className="auth-logo">
                            <img
                                src="https://c1.tablecdn.com/maillayer/logo.png"
                                alt="Maillayer"
                                className="auth-logo-img"
                            />
                        </div>

                        {/* Header */}
                        <div className="auth-header">
                            <h1>Reset your password</h1>
                            <p>Enter your email and we&apos;ll send you instructions to reset your password</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="auth-alert auth-alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {message ? (
                            <div className="success-state">
                                <div className="success-icon">
                                    <CheckCircle size={32} />
                                </div>
                                <h2>Check your email</h2>
                                <p>{message}</p>
                                <Link
                                    href="/login"
                                    className="back-to-login"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back to login</span>
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Form */}
                                <form
                                    onSubmit={handleSubmit}
                                    className="auth-form"
                                >
                                    <div className="form-group">
                                        <label htmlFor="email">Email address</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            disabled={isLoading}
                                            autoComplete="email"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="auth-submit"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader
                                                    size={16}
                                                    className="spin"
                                                />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <span>Send reset link</span>
                                        )}
                                    </button>
                                </form>

                                {/* Footer */}
                                <div className="auth-footer">
                                    <Link
                                        href="/login"
                                        className="back-link"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>Back to login</span>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bottom text */}
                    <p className="auth-tagline">Email Marketing Platform</p>
                </div>
            </div>

            <style jsx>{`
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
                    margin-bottom: 32px;
                }

                .auth-logo :global(.auth-logo-img) {
                    height: 28px !important;
                    max-height: 28px !important;
                    width: auto !important;
                    display: block;
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 28px;
                }

                .header-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 48px;
                    height: 48px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 12px;
                    color: #818cf8;
                    margin-bottom: 16px;
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
                    line-height: 1.5;
                }

                .auth-alert {
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

                .success-state {
                    text-align: center;
                }

                .success-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 56px;
                    height: 56px;
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.2);
                    border-radius: 14px;
                    color: #22c55e;
                    margin-bottom: 20px;
                }

                .success-state h2 {
                    font-size: 20px;
                    font-weight: 600;
                    color: #fafafa;
                    margin: 0 0 8px;
                }

                .success-state p {
                    font-size: 14px;
                    color: #71717a;
                    margin: 0 0 24px;
                    line-height: 1.5;
                }

                .back-to-login {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #6366f1;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.15s;
                }

                .back-to-login:hover {
                    color: #818cf8;
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
                }

                .auth-submit {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 12px 20px;
                    background: #171717;
                    border: none;
                    border-radius: 8px;
                    color: #fafafa;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .auth-submit:hover:not(:disabled) {
                    background: #262626;
                }

                .auth-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .auth-footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #71717a;
                    text-decoration: none;
                    transition: color 0.15s;
                }

                .back-link:hover {
                    color: #a1a1aa;
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
            `}</style>
        </>
    );
}
