import { useState, useEffect } from 'react';

/**
 * Drift detection: periodically compares local time to server time.
 * On network offline: caches last healthy drift value in localStorage.
 */
export const useDriftDetection = (healthEndpoint = '/health', checkIntervalMs = 60000) => {
    const [drift, setDrift] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const checkDrift = async () => {
            try {
                const clientBefore = Date.now();
                const res = await fetch(healthEndpoint);
                const data = await res.json();
                const clientAfter = Date.now();

                const serverTime = new Date(data.timestamp).getTime();
                const clientMid = (clientBefore + clientAfter) / 2;
                const newDrift = clientMid - serverTime;

                setDrift(newDrift);
                localStorage.setItem('chronex-drift', String(newDrift));
            } catch {
                // Offline — use cached drift
                const cached = localStorage.getItem('chronex-drift');
                if (cached) setDrift(Number(cached));
            }
        };

        checkDrift();
        const interval = setInterval(checkDrift, checkIntervalMs);

        const handleOnline = () => { setIsOnline(true); checkDrift(); };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [healthEndpoint, checkIntervalMs]);

    return { drift, isOnline };
};

export default useDriftDetection;
