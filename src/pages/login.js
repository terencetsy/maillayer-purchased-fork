import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MailOutgoing } from '@/lib/icons';
import { Loader } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            router.push('/brands');
        } catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Login - Maillayer</title>
                <meta
                    name="description"
                    content="Login to your account"
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
                            <h1>Welcome back</h1>
                            <p>Sign in to your account</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

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

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className="auth-forgot">
                                <Link href="/forgot-password">Forgot password?</Link>
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
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <span>Sign in</span>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
