import { EventData } from '../types';
import { buildContent, escapeText, sanitizeSingleLine } from './contentLine';
import { normalizeUrl } from './url';

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseLocalDateTime = (value: string): DateTimeParts => {
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) throw new Error('Use a valid date and time.');

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  };
};

const getPartsInTimezone = (date: Date, timezone: string): DateTimeParts => {
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
};

const partsMatch = (left: DateTimeParts, right: DateTimeParts) =>
  left.year === right.year
  && left.month === right.month
  && left.day === right.day
  && left.hour === right.hour
  && left.minute === right.minute
  && left.second === right.second;

export const zonedDateTimeToUtc = (value: string, timezone: string): Date => {
  const desired = parseLocalDateTime(value);
  const wallClockAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
    desired.second,
  );

  let candidate = wallClockAsUtc;
  for (let index = 0; index < 4; index += 1) {
    const rendered = getPartsInTimezone(new Date(candidate), timezone);
    const renderedAsUtc = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
      rendered.second,
    );
    const nextCandidate = candidate + (wallClockAsUtc - renderedAsUtc);
    if (nextCandidate === candidate) break;
    candidate = nextCandidate;
  }

  const result = new Date(candidate);
  if (!partsMatch(getPartsInTimezone(result, timezone), desired)) {
    throw new Error('That local time does not exist in the selected time zone. Check daylight-saving time.');
  }

  return result;
};

const formatUtc = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const formatDate = (value: string) => value.replace(/-/g, '');

const addOneDay = (value: string) => {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error('Use a valid date.');

  const date = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]) + 1,
  ));
  return date.toISOString().slice(0, 10);
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? formatUtc(new Date()) : formatUtc(date);
};

export const generateVCalendarString = (data: EventData): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//vCard QR Generator//EN',
    'BEGIN:VEVENT',
    `UID:${sanitizeSingleLine(data.uid)}`,
    `DTSTAMP:${formatTimestamp(data.createdAt)}`,
    `SUMMARY:${escapeText(data.title.trim())}`,
  ];

  if (data.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDate(data.startTime)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(addOneDay(data.endTime))}`);
  } else {
    lines.push(`DTSTART:${formatUtc(zonedDateTimeToUtc(data.startTime, data.timezone))}`);
    lines.push(`DTEND:${formatUtc(zonedDateTimeToUtc(data.endTime, data.timezone))}`);
  }

  if (data.location.trim()) lines.push(`LOCATION:${escapeText(data.location.trim())}`);
  if (data.description.trim()) lines.push(`DESCRIPTION:${escapeText(data.description.trim())}`);
  if (data.url.trim()) lines.push(`URL:${sanitizeSingleLine(normalizeUrl(data.url))}`);

  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return buildContent(lines);
};
