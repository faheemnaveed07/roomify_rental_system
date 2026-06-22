export type CalendarDateInput = string | Date | null | undefined;

const CALENDAR_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

const extractCalendarDate = (value: CalendarDateInput): string | null => {
    if (!value) return null;

    if (typeof value === 'string') {
        const match = value.match(CALENDAR_PREFIX_REGEX);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString().slice(0, 10);
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return value.toISOString().slice(0, 10);
    }

    return null;
};

export const formatBookingCalendarDate = (
    value: CalendarDateInput,
    locale?: string
): string => {
    const calendarDate = extractCalendarDate(value);
    if (!calendarDate) return 'Invalid date';

    const utcDate = new Date(`${calendarDate}T00:00:00.000Z`);
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
    }).format(utcDate);
};
