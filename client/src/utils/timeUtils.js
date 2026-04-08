import { DateTime } from 'luxon';

/**
 * Gets Luxon format string based on preference
 */
export function getLuxonFormat(type, format = '12h') {
    const is24h = format === '24h';
    switch (type) {
        case 'full': return is24h ? 'HH:mm:ss' : 'hh:mm:ss a';
        case 'short': return is24h ? 'HH:mm' : 'h:mm a';
        case 'hour': return is24h ? 'HH:00' : 'h a';
        default: return is24h ? 'HH:mm' : 'h:mm a';
    }
}

/**
 * Formats an hour number (0-23) into a string based on preference
 */
export function fmtHr(h, format = '12h') {
    const is24h = format === '24h';
    if (is24h) {
        return `${String(h).padStart(2, '0')}:00`;
    }
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display} ${ampm}`;
}

/**
 * Formats a DateTime or ISO string into a standard display format
 */
export function formatFullTime(dt, format = '12h') {
    const luxonDt = typeof dt === 'string' ? DateTime.fromISO(dt) : dt;
    if (!luxonDt || !luxonDt.isValid) return 'Invalid Time';
    return luxonDt.toFormat(getLuxonFormat('full', format));
}

/**
 * Formats a DateTime for tooltips and short cards
 */
export function formatShortTime(dt, format = '12h') {
    const luxonDt = typeof dt === 'string' ? DateTime.fromISO(dt) : dt;
    if (!luxonDt || !luxonDt.isValid) return 'Invalid Time';
    return luxonDt.toFormat(getLuxonFormat('short', format));
}
