// src/lib/session.js
import { useState, useEffect } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';

export function useStableSession() {
    const { data: session, status } = useNextAuthSession();
    const [stableSession, setStableSession] = useState(null);

    useEffect(() => {
        if (status === 'authenticated' && session) {
            setStableSession(session);
        }
    }, [status, session]);

    return {
        data: stableSession,
        status: stableSession ? 'authenticated' : status,
    };
}
