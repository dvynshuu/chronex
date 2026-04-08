/**
 * Generates an iCalendar (.ics) file string.
 * @param {Object} event - The event details.
 * @param {string} event.title - Meeting title.
 * @param {string} event.description - Meeting description.
 * @param {Date} event.start - Start time Date object.
 * @param {number} event.duration - Duration in minutes.
 * @returns {string} - The ICS content.
 */
export const generateICS = (event) => {
    const { title, description, start, duration } = event;
    
    // Format Date to YYYYMMDDTHHMMSSZ
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const endDate = new Date(start.getTime() + duration * 60000);

    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Chronex//NONSGML v1.0//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    return icsLines.join('\r\n');
};

/**
 * Triggers a browser download for the generated ICS file.
 */
export const downloadICS = (title, content) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
