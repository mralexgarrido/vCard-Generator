import { describe, expect, it } from 'vitest';
import { EventData } from '../types';
import { generateVCalendarString, zonedDateTimeToUtc } from '../utils/calendarHelper';

const event = (overrides: Partial<EventData> = {}): EventData => ({
  title: 'Community Meetup',
  location: 'Main Hall, Room 2',
  startTime: '2026-09-17T14:30',
  endTime: '2026-09-17T15:30',
  description: 'Bring ideas;\ncoffee is provided.',
  url: 'example.com/register',
  timezone: 'America/Chicago',
  allDay: false,
  uid: 'stable-test-id@vcard-qr-generator',
  createdAt: '2026-09-03T20:00:00.000Z',
  ...overrides,
});

describe('generateVCalendarString', () => {
  it('converts a local timed event to UTC and keeps stable identity metadata', () => {
    const output = generateVCalendarString(event());

    expect(output).toContain('PRODID:-//vCard QR Generator//EN\r\n');
    expect(output).toContain('UID:stable-test-id@vcard-qr-generator\r\n');
    expect(output).toContain('DTSTAMP:20260903T200000Z\r\n');
    expect(output).toContain('DTSTART:20260917T193000Z\r\n');
    expect(output).toContain('DTEND:20260917T203000Z\r\n');
    expect(output).toContain('LOCATION:Main Hall\\, Room 2\r\n');
    expect(output).toContain('DESCRIPTION:Bring ideas\\;\\ncoffee is provided.\r\n');
    expect(output).toContain('URL:https://example.com/register\r\n');
    expect(output.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('uses an exclusive end date for inclusive all-day input', () => {
    const output = generateVCalendarString(event({
      allDay: true,
      startTime: '2026-12-24',
      endTime: '2026-12-26',
    }));

    expect(output).toContain('DTSTART;VALUE=DATE:20261224\r\n');
    expect(output).toContain('DTEND;VALUE=DATE:20261227\r\n');
  });

  it('rejects a wall time that does not exist during a daylight-saving transition', () => {
    expect(() => zonedDateTimeToUtc('2026-03-08T02:30', 'America/New_York'))
      .toThrow(/does not exist/);
  });
});
