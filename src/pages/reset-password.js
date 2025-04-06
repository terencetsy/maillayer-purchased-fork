import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MailSend02 } from '@/lib/icons';

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
        // Verify the token when it's available in the URL
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

            setMessage('Your password has been reset successfully. You can now log in with your new password.');
            setPassword('');
            setConfirmPassword('');

            // Redirect to login page after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
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
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo">
                            <MailSend02 />
                        </div>
                        <h1>Reset Password</h1>
                        <p>Verifying your reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Reset Password | Maillayer</title>
                <meta
                    name="description"
                    content="Reset your Maillayer account password"
                />
            </Head>

            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo">
                            <MailSend02 />
                        </div>
                        <h1>Reset Password</h1>
                        <p>Create a new password for your account</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}
                    {message && <div className="alert alert-success">{message}</div>}

                    {isTokenValid ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="password">New Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={isLoading}
                            >
                                <span>{isLoading ? 'Resetting...' : 'Reset Password'}</span>
                            </button>
                        </form>
                    ) : (
                        <div className="text-center mt-lg">
                            <Link
                                href="/forgot-password"
                                className="btn btn-secondary btn-block"
                            >
                                Request a new reset link
                            </Link>
                        </div>
                    )}

                    <div className="text-center mt-lg">
                        <Link
                            href="/login"
                            className="auth-link"
                        >
                            Remember your password? Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
