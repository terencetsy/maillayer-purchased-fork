import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { MailOutgoing } from '@/lib/icons';
import { Loader } from 'lucide-react';

export default function Signup() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkAdminExists = async () => {
            try {
                const res = await fetch('/api/auth/check-admin', { method: 'GET' });
                const data = await res.json();
                if (data.adminExists) {
                    router.push('/login');
                }
            } catch (error) {
                console.error('Error checking admin existence:', error);
            }
        };

        checkAdminExists();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !password) {
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

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Something went wrong');
            }

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
            console.error('Signup error:', error);
            setError(error.message || 'An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign Up - Maillayer</title>
                <meta
                    name="description"
                    content="Create your account"
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
                            <h1>Create account</h1>
                            <p>Set up your administrator account</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form
                            onSubmit={handleSubmit}
                            className="auth-form"
                        >
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    disabled={isLoading}
                                    autoComplete="name"
                                />
                            </div>

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
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <span>Create Account</span>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Already have an account? <Link href="/login">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
