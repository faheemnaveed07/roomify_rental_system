import { describe, expect, it } from 'vitest';
import { formatBookingCalendarDate } from './date';

const formatByZone = (iso: string, timeZone: string): string =>
    new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone,
    }).format(new Date(iso));

describe('formatBookingCalendarDate', () => {
    const selectedDateIso = '2026-06-30T00:00:00.000Z';

    it('preserves selected calendar date in UTC timezone', () => {
        expect(formatByZone(selectedDateIso, 'UTC')).toBe('30/06/2026');
        expect(formatBookingCalendarDate(selectedDateIso, 'en-GB')).toBe('30/06/2026');
    });

    it('preserves selected calendar date for negative offset timezone', () => {
        // Native local-zone rendering for midnight UTC shifts to prior day in America/Los_Angeles.
        expect(formatByZone(selectedDateIso, 'America/Los_Angeles')).toBe('29/06/2026');
        expect(formatBookingCalendarDate(selectedDateIso, 'en-GB')).toBe('30/06/2026');
    });

    it('preserves selected calendar date for positive offset timezone', () => {
        expect(formatByZone(selectedDateIso, 'Asia/Karachi')).toBe('30/06/2026');
        expect(formatBookingCalendarDate(selectedDateIso, 'en-GB')).toBe('30/06/2026');
    });

    it('supports date-only values from input[type=date]', () => {
        expect(formatBookingCalendarDate('2026-06-30', 'en-GB')).toBe('30/06/2026');
    });
});
