import { DateTime } from 'luxon';

/**
 * Formats an hour number (0-23) into a 12-hour string (e.g. 12 AM, 6 PM)
 */
export function fmtHr(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display} ${ampm}`;
}

/**
 * Formats a DateTime or ISO string into a standard display format
 */
export function formatFullTime(dt) {
    const luxonDt = typeof dt === 'string' ? DateTime.fromISO(dt) : dt;
    return luxonDt.toFormat('hh:mm:ss a');
}

/**
 * Formats a DateTime for tooltips and short cards
 */
export function formatShortTime(dt) {
    const luxonDt = typeof dt === 'string' ? DateTime.fromISO(dt) : dt;
    return luxonDt.toFormat('hh:mm a');
}
