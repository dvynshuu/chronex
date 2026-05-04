import { useMemo } from 'react';
import { DateTime } from 'luxon';

/**
 * Custom hook: given a timezone + work hours config → returns current status
 * Replaces the hardcoded getTimeContext and getContext logic
 */
export const useAvailability = (timezone, workStart = 9, workEnd = 17, workDays = [1, 2, 3, 4, 5]) => {
    return useMemo(() => {
        let localNow;
        try {
            localNow = DateTime.local().setZone(timezone);
            if (!localNow.isValid) localNow = DateTime.local();
        } catch {
            localNow = DateTime.local();
        }

        const hour = localNow.hour;
        const dayOfWeek = localNow.weekday;
        const isWorkDay = workDays.includes(dayOfWeek);

        if (!isWorkDay) {
            return { label: 'Day Off', icon: '🏖️', color: 'var(--color-text-dim)', range: 'Non-working day', isAvailable: false };
        }
        if (hour >= workStart && hour < workEnd) {
            return { label: 'Available', icon: '🟢', color: 'var(--color-success)', range: `${fmtHour(workStart)} – ${fmtHour(workEnd)}`, isAvailable: true };
        }
        if (hour >= 22 || hour < 5) {
            return { label: 'Sleeping', icon: '🌙', color: 'var(--color-night)', range: '10 PM – 5 AM', isAvailable: false };
        }
        if (hour >= 5 && hour < workStart) {
            return { label: 'Early Morning', icon: '🌅', color: 'var(--color-day)', range: `5 AM – ${fmtHour(workStart)}`, isAvailable: false };
        }
        return { label: 'Off Hours', icon: '🏠', color: 'var(--color-sunset)', range: `${fmtHour(workEnd)} – 10 PM`, isAvailable: false };
    }, [timezone, workStart, workEnd, workDays]);
};

/**
 * Compute 24h overlap data for multiple participants (client-side)
 * Optimized for high performance (O(N) vs O(N*24)).
 */
export const computeOverlapData = (participants) => {
    const numParticipants = participants.length;
    if (numParticipants === 0) return [];

    const workingCounts = new Int32Array(24);
    const now = DateTime.local().startOf('day');

    // 1. Single pass to build histogram
    participants.forEach(p => {
        const { zone, workStart = 9, workEnd = 17 } = p;
        let offset;
        try {
            offset = now.setZone(zone).offset / 60;
        } catch {
            offset = 0;
        }

        for (let h = workStart; h < workEnd; h++) {
            const baseH = (h - Math.floor(offset) + 24) % 24;
            workingCounts[baseH]++;
        }
    });

    // 2. Generate result array
    return Array.from({ length: 24 }, (_, h) => {
        const count = workingCounts[h];
        const score = count / numParticipants;
        let status;
        if (score === 1) status = 'perfect';
        else if (score >= 0.5) status = 'good';
        else if (score > 0) status = 'partial';
        else status = 'avoid';

        return { 
            utcHour: h, 
            score, 
            maxScore: 1, 
            status, 
            workingCount: count, 
            totalParticipants: numParticipants 
        };
    });
};

function fmtHour(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display} ${ampm}`;
}

export default useAvailability;
