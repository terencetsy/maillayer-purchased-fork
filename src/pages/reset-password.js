import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Loader } from 'lucide-react';

export default function ResetPassword() {
    const router = useRouter();
    const { token } = router.query;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(null);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) return;

            try {
                const response = await fetch(`/api/auth/verify-reset-token?token=${token}`, {
                    method: 'GET',
                });

                if (response.ok) {
                    setIsTokenValid(true);
                } else {
                    setIsTokenValid(false);
                    setError('This password reset link is invalid or has expired.');
                }
            } catch (error) {
                console.error('Token verification error:', error);
                setIsTokenValid(false);
                setError('An error occurred while verifying your reset link.');
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
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

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setMessage('Your password has been reset successfully. Redirecting to login...');
            setPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            console.error('Reset password error:', error);
            setError(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state while verifying token
    if (isTokenValid === null && token) {
        return (
            <>
                <Head>
                    <title>Reset Password - Maillayer</title>
                    <meta
                        name="description"
                        content="Reset your password"
                    />
                </Head>
                <div className="auth-page">
                    <div className="auth-container">
                        <div className="auth-card">
                            <div className="auth-logo">
                                <img src="https://c1.tablecdn.com/maillayer/logo.png" alt="Maillayer" height={32} />
                            </div>
                            <div className="auth-header">
                                <h1>Reset Password</h1>
                                <p>Verifying your reset link...</p>
                            </div>
                            <div className="auth-loading">
                                <Loader
                                    size={24}
                                    className="spinner"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Reset Password - Maillayer</title>
                <meta
                    name="description"
                    content="Reset your password"
                />
            </Head>

            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-logo">
                            <img src="https://c1.tablecdn.com/maillayer/logo.png" alt="Maillayer" height={32} />
                        </div>

                        <div className="auth-header">
                            <h1>Reset Password</h1>
                            <p>Create a new password for your account</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        {message && <div className="alert alert-success">{message}</div>}

                        {isTokenValid ? (
                            <form
                                onSubmit={handleSubmit}
                                className="auth-form"
                            >
                                <div className="form-group">
                                    <label htmlFor="password">New Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="button button--primary button--full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader
                                                size={16}
                                                className="spinner"
                                            />
                                            <span>Resetting...</span>
                                        </>
                                    ) : (
                                        <span>Reset Password</span>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="auth-form">
                                <Link
                                    href="/forgot-password"
                                    className="button button--secondary button--full"
                                >
                                    Request New Link
                                </Link>
                            </div>
                        )}

                        <div className="auth-footer">
                            <p>
                                Remember your password? <Link href="/login">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
