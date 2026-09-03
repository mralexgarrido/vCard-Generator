import { describe, expect, it } from 'vitest';
import { parseGeneratorFile } from '../utils/importHelper';

describe('parseGeneratorFile', () => {
  it('imports common vCard fields, escaped text, and a folded content line', () => {
    const imported = parseGeneratorFile([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Lee;Jordan;;;',
      'FN:Jordan Lee',
      'ORG:Northwind Creative',
      'TITLE:Creative Director',
      'TEL;TYPE=CELL:+1 555 010 2020',
      'TEL;TYPE=WORK:+1 555 010 3030',
      'EMAIL:jordan@example.com',
      'URL:https://example.com',
      'ADR;TYPE=WORK:;;123 Main Street;Austin;Texas;78701;United States',
      'NOTE:Met at the community open house\,',
      ' September 2026.',
      'END:VCARD',
    ].join('\r\n'));

    expect(imported.mode).toBe('contact');
    expect(imported.contact).toMatchObject({
      firstName: 'Jordan',
      lastName: 'Lee',
      organization: 'Northwind Creative',
      title: 'Creative Director',
      mobile: '+1 555 010 2020',
      phone: '+1 555 010 3030',
      email: 'jordan@example.com',
      city: 'Austin',
      note: 'Met at the community open house,September 2026.',
    });
  });

  it('imports a UTC calendar event and its reminder', () => {
    const imported = parseGeneratorFile([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:test-event@example.com',
      'DTSTAMP:20260903T200000Z',
      'SUMMARY:Community Meetup',
      'DTSTART:20260917T193000Z',
      'DTEND:20260917T203000Z',
      'LOCATION:Main Hall\, Room 2',
      'DESCRIPTION:Bring ideas\; coffee is provided.',
      'URL:https://example.com/register',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n'));

    expect(imported.mode).toBe('event');
    expect(imported.event).toMatchObject({
      title: 'Community Meetup',
      location: 'Main Hall, Room 2',
      description: 'Bring ideas; coffee is provided.',
      url: 'https://example.com/register',
      reminderMinutes: 30,
      uid: 'test-event@example.com',
    });
    expect(imported.event?.startTime).toMatch(/^2026-09-17T\d{2}:30$/);
    expect(imported.event?.endTime).toMatch(/^2026-09-17T\d{2}:30$/);
  });

  it('converts an exclusive all-day end date back to an inclusive form value', () => {
    const imported = parseGeneratorFile([
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:Conference',
      'DTSTART;VALUE=DATE:20261224',
      'DTEND;VALUE=DATE:20261227',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n'));

    expect(imported.event).toMatchObject({
      allDay: true,
      startTime: '2026-12-24',
      endTime: '2026-12-26',
      reminderMinutes: null,
    });
  });

  it('rejects unsupported content', () => {
    expect(() => parseGeneratorFile('not a contact or event')).toThrow(/valid VCF contact file or ICS calendar file/);
  });
});
