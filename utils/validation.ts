import { ContactData, EventData } from '../types';
import { zonedDateTimeToUtc } from './calendarHelper';
import { isValidWebUrl } from './url';

export const MAX_QR_BYTES = 1_800;
export const QR_WARNING_BYTES = 1_000;

export const isValidTimezone = (timezone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
};

const isValidDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

export const validateContact = (data: ContactData): string[] => {
  const errors: string[] = [];

  if (![data.firstName, data.lastName, data.organization].some((value) => value.trim())) {
    errors.push('Add a name or organization.');
  }

  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push('Enter a valid email address.');
  }

  if (!isValidWebUrl(data.website)) errors.push('Enter a valid website URL.');
  return errors;
};

export const validateEvent = (data: EventData): string[] => {
  const errors: string[] = [];

  if (!data.title.trim()) errors.push('Add an event title.');
  if (!data.startTime) errors.push('Add a start date and time.');
  if (!data.endTime) errors.push('Add an end date and time.');
  if (!isValidWebUrl(data.url)) errors.push('Enter a valid event URL.');
  if (
    data.reminderMinutes !== null
    && (!Number.isInteger(data.reminderMinutes) || data.reminderMinutes < 0 || data.reminderMinutes > 10_080)
  ) {
    errors.push('Choose a valid event reminder.');
  }

  if (data.allDay) {
    if (data.startTime && !isValidDateOnly(data.startTime)) errors.push('Enter a valid start date.');
    if (data.endTime && !isValidDateOnly(data.endTime)) errors.push('Enter a valid end date.');
    if (
      isValidDateOnly(data.startTime)
      && isValidDateOnly(data.endTime)
      && data.endTime < data.startTime
    ) {
      errors.push('The end date must be on or after the start date.');
    }
    return errors;
  }

  if (!isValidTimezone(data.timezone)) {
    errors.push('Choose a valid IANA time zone.');
    return errors;
  }

  if (data.startTime && data.endTime) {
    try {
      const start = zonedDateTimeToUtc(data.startTime, data.timezone);
      const end = zonedDateTimeToUtc(data.endTime, data.timezone);
      if (end <= start) errors.push('The end time must be after the start time.');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Check the event date and time.');
    }
  }

  return [...new Set(errors)];
};

export const getByteLength = (value: string) => new TextEncoder().encode(value).length;
