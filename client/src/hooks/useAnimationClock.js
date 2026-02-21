import { useState, useEffect, useCallback, useRef } from 'react';
import { DateTime } from 'luxon';

/**
 * Global animation-frame clock. Single RAF loop; components subscribe.
 * Replaces multiple setInterval calls for better perf & sync.
 */
export const useAnimationClock = (intervalMs = 1000) => {
    const [now, setNow] = useState(() => DateTime.local());
    const lastTickRef = useRef(performance.now());
    const rafRef = useRef(null);

    const tick = useCallback((timestamp) => {
        if (timestamp - lastTickRef.current >= intervalMs) {
            if (!document.hidden) {
                setNow(DateTime.local());
            }
            lastTickRef.current = timestamp;
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [intervalMs]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);

        const handleVisibility = () => {
            if (!document.hidden) {
                setNow(DateTime.local());
                lastTickRef.current = performance.now();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [tick]);

    return now;
};

export default useAnimationClock;
