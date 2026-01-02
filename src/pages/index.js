import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loadingText, setLoadingText] = useState('Initializing');

    useEffect(() => {
        // Animate loading text
        const texts = ['Initializing', 'Checking session', 'Preparing dashboard'];
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % texts.length;
            setLoadingText(texts[index]);
        }, 800);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Redirects are handled in middleware, but this is a fallback
        const checkAndRedirect = async () => {
            if (status === 'loading') return;

            try {
                // Check if admin exists
                const res = await fetch('/api/auth/check-admin');
                const data = await res.json();

                if (session) {
                    // If authenticated, go to dashboard
                    router.push('/brands');
                } else if (!data.adminExists) {
                    // If no admin, go to signup
                    router.push('/signup');
                } else {
                    // Otherwise, go to login
                    router.push('/login');
                }
            } catch (error) {
                console.error('Error checking admin existence:', error);
                // Default to login page on error
                router.push('/login');
            }
        };

        checkAndRedirect();
    }, [session, status, router]);

    return (
        <>
            <Head>
                <title>Maillayer - Email Marketing Platform</title>
            </Head>
            <div className="splash-screen">
                {/* Background gradient effects */}
                <div className="splash-bg">
                    <div className="gradient-orb gradient-orb-1"></div>
                    <div className="gradient-orb gradient-orb-2"></div>
                </div>

                {/* Main content */}
                <div className="splash-content">
                    {/* Logo */}
                    <div className="splash-logo">
                        <img
                            src="https://c1.tablecdn.com/maillayer/logo.png"
                            alt="Maillayer"
                            className="logo-image"
                        />
                    </div>

                    {/* Loading indicator */}
                    <div className="splash-loader">
                        <div className="loader-bar">
                            <div className="loader-progress"></div>
                        </div>
                    </div>

                    {/* Loading text */}
                    <p className="splash-text">{loadingText}</p>
                </div>

                {/* Footer */}
                <div className="splash-footer">
                    <span>Email Marketing Platform</span>
                </div>
            </div>

            <style jsx>{`
                .splash-screen {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #000;
                    overflow: hidden;
                }

                .splash-bg {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                }

                .gradient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.15;
                }

                .gradient-orb-1 {
                    width: 600px;
                    height: 600px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    top: -200px;
                    right: -100px;
                    animation: float1 8s ease-in-out infinite;
                }

                .gradient-orb-2 {
                    width: 500px;
                    height: 500px;
                    background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
                    bottom: -150px;
                    left: -100px;
                    animation: float2 10s ease-in-out infinite;
                }

                @keyframes float1 {
                    0%,
                    100% {
                        transform: translate(0, 0) scale(1);
                    }
                    50% {
                        transform: translate(-30px, 30px) scale(1.05);
                    }
                }

                @keyframes float2 {
                    0%,
                    100% {
                        transform: translate(0, 0) scale(1);
                    }
                    50% {
                        transform: translate(30px, -20px) scale(1.03);
                    }
                }

                .splash-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 32px;
                }

                .splash-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .splash-logo :global(.logo-image) {
                    height: 48px;
                    width: auto;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%,
                    100% {
                        filter: drop-shadow(0 0 0 rgba(99, 102, 241, 0));
                        transform: scale(1);
                    }
                    50% {
                        filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3));
                        transform: scale(1.02);
                    }
                }

                .splash-loader {
                    width: 200px;
                }

                .loader-bar {
                    height: 3px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .loader-progress {
                    height: 100%;
                    width: 40%;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1);
                    background-size: 200% 100%;
                    border-radius: 3px;
                    animation: loading 1.5s ease-in-out infinite;
                }

                @keyframes loading {
                    0% {
                        transform: translateX(-100%);
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        transform: translateX(350%);
                        background-position: 0% 50%;
                    }
                }

                .splash-text {
                    font-size: 13px;
                    color: #52525b;
                    margin: 0;
                    min-width: 140px;
                    text-align: center;
                    animation: fadeText 0.3s ease;
                }

                @keyframes fadeText {
                    0% {
                        opacity: 0.5;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                .splash-footer {
                    position: absolute;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1;
                }

                .splash-footer span {
                    font-size: 12px;
                    color: #3f3f46;
                    letter-spacing: 0.5px;
                }
            `}</style>
        </>
    );
}
