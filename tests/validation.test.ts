import { describe, expect, it } from 'vitest';
import { ContactData, EventData } from '../types';
import { isValidWebUrl, normalizeUrl } from '../utils/url';
import { validateContact, validateEvent } from '../utils/validation';

describe('URL utilities', () => {
  it('adds https to a bare domain and rejects unsupported schemes', () => {
    expect(normalizeUrl('example.com/path')).toBe('https://example.com/path');
    expect(isValidWebUrl('example.com/path')).toBe(true);
    expect(isValidWebUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('generator validation', () => {
  it('requires a contact name or organization', () => {
    const emptyContact = {
      firstName: '', lastName: '', organization: '', title: '', email: '', phone: '',
      mobile: '', website: '', street: '', addressLine2: '', city: '', state: '',
      zip: '', country: '', note: '',
    } satisfies ContactData;

    expect(validateContact(emptyContact)).toContain('Add a name or organization.');
  });

  it('requires an event to end after it begins', () => {
    const invalidEvent = {
      title: 'Test',
      location: '',
      startTime: '2026-09-17T15:30',
      endTime: '2026-09-17T14:30',
      description: '',
      url: '',
      timezone: 'America/Chicago',
      allDay: false,
      reminderMinutes: null,
      uid: 'test@example',
      createdAt: '2026-09-03T20:00:00.000Z',
    } satisfies EventData;

    expect(validateEvent(invalidEvent)).toContain('The end time must be after the start time.');
  });

  it('rejects impossible all-day dates', () => {
    const invalidEvent = {
      title: 'Test',
      location: '',
      startTime: '2026-02-31',
      endTime: '2026-03-01',
      description: '',
      url: '',
      timezone: 'UTC',
      allDay: true,
      reminderMinutes: null,
      uid: 'test@example',
      createdAt: '2026-09-03T20:00:00.000Z',
    } satisfies EventData;

    expect(validateEvent(invalidEvent)).toContain('Enter a valid start date.');
  });

  it('rejects an out-of-range imported reminder', () => {
    const invalidEvent = {
      title: 'Test',
      location: '',
      startTime: '2026-09-17T14:30',
      endTime: '2026-09-17T15:30',
      description: '',
      url: '',
      timezone: 'UTC',
      allDay: false,
      reminderMinutes: -15,
      uid: 'test@example',
      createdAt: '2026-09-03T20:00:00.000Z',
    } satisfies EventData;

    expect(validateEvent(invalidEvent)).toContain('Choose a valid event reminder.');
  });
});
