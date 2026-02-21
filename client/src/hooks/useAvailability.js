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
            localNow = DateTime.utc().setZone(timezone);
            if (!localNow.isValid) localNow = DateTime.utc();
        } catch {
            localNow = DateTime.utc();
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
 */
export const computeOverlapData = (participants) => {
    const now = DateTime.utc().startOf('day');
    const result = [];

    for (let h = 0; h < 24; h++) {
        const utcHour = now.plus({ hours: h });
        let workingCount = 0;
        const details = [];

        participants.forEach(p => {
            const { zone, workStart = 9, workEnd = 17 } = p;
            let local;
            try {
                local = utcHour.setZone(zone);
                if (!local.isValid) local = utcHour;
            } catch {
                local = utcHour;
            }

            const localHour = local.hour;
            const isWorking = localHour >= workStart && localHour < workEnd;
            if (isWorking) workingCount++;

            details.push({ zone, localHour, localTime: local.toFormat('HH:mm'), isWorking, name: p.name || zone });
        });

        const score = participants.length > 0 ? workingCount / participants.length : 0;
        let status;
        if (score === 1) status = 'perfect';
        else if (score >= 0.5) status = 'good';
        else if (score > 0) status = 'partial';
        else status = 'avoid';

        result.push({ utcHour: h, score, maxScore: 1, status, workingCount, totalParticipants: participants.length, details });
    }
    return result;
};

function fmtHour(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display} ${ampm}`;
}

export default useAvailability;
