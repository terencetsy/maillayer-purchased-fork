import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MailOutgoing } from '@/lib/icons';
import { Loader } from 'lucide-react';

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
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-logo">
                            <MailOutgoing size={32} />
                            <span>Maillayer</span>
                        </div>

                        <div className="auth-header">
                            <h1>Forgot Password</h1>
                            <p>Enter your email to receive reset instructions</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        {message && <div className="alert alert-success">{message}</div>}

                        <form
                            onSubmit={handleSubmit}
                            className="auth-form"
                        >
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
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
                                className="button button--primary button--full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader
                                            size={16}
                                            className="spinner"
                                        />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <span>Send Reset Link</span>
                                )}
                            </button>
                        </form>

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
