import {
  ContactData,
  createInitialContactData,
  createInitialEventData,
  EventData,
  QrMode,
} from '../types';

export interface ImportedGeneratorData {
  mode: QrMode;
  contact?: ContactData;
  event?: EventData;
}

interface ParsedLine {
  name: string;
  parameters: Map<string, string>;
  rawProperty: string;
  value: string;
}

const unfoldLines = (content: string) => content
  .replace(/\r\n[ \t]/g, '')
  .replace(/\n[ \t]/g, '')
  .split(/\r\n|\n|\r/)
  .filter(Boolean);

const parseLine = (line: string): ParsedLine | null => {
  const separator = line.indexOf(':');
  if (separator < 0) return null;

  const rawProperty = line.slice(0, separator);
  const segments = rawProperty.split(';');
  const qualifiedName = segments.shift() || '';
  const name = (qualifiedName.split('.').pop() || qualifiedName).toUpperCase();
  const parameters = new Map<string, string>();

  segments.forEach((segment) => {
    const [key, ...valueParts] = segment.split('=');
    if (valueParts.length) parameters.set(key.toUpperCase(), valueParts.join('=').replace(/^"|"$/g, ''));
  });

  return { name, parameters, rawProperty, value: line.slice(separator + 1) };
};

const unescapeText = (value: string) => {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '\\' || index === value.length - 1) {
      result += value[index];
      continue;
    }

    const next = value[index + 1];
    result += next === 'n' || next === 'N' ? '\n' : next;
    index += 1;
  }
  return result;
};

const splitEscaped = (value: string, separator: string) => {
  const parts: string[] = [];
  let current = '';
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      current += `\\${character}`;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === separator) {
      parts.push(unescapeText(current));
      current = '';
    } else {
      current += character;
    }
  }

  if (escaped) current += '\\';
  parts.push(unescapeText(current));
  return parts;
};

const pad = (value: number) => String(value).padStart(2, '0');

const formatLocalDateTime = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const parseBasicDateTime = (value: string) => {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?/.exec(value);
  if (!match) return '';
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
};

const parseUtcDateTime = (value: string) => {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z$/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] || 0),
  ));
};

const parseDateOnly = (value: string) => {
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
};

const shiftDate = (value: string, days: number) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return date.toISOString().slice(0, 10);
};

const addMinutes = (value: string, minutes: number) => {
  const timestamp = Date.parse(`${value}:00Z`);
  return Number.isNaN(timestamp)
    ? value
    : new Date(timestamp + minutes * 60_000).toISOString().slice(0, 16);
};

const getFirst = (lines: ParsedLine[], name: string) => lines.find((line) => line.name === name);
const limit = (value: string, maxLength: number) => value.slice(0, maxLength);

const parseContact = (lines: ParsedLine[]): ContactData => {
  const data = createInitialContactData();
  const nameLine = getFirst(lines, 'N');
  const formattedName = unescapeText(getFirst(lines, 'FN')?.value || '').trim();

  if (nameLine) {
    const [lastName = '', firstName = ''] = splitEscaped(nameLine.value, ';');
    data.firstName = limit(firstName.trim(), 80);
    data.lastName = limit(lastName.trim(), 80);
  } else if (formattedName) {
    const parts = formattedName.split(/\s+/);
    data.lastName = limit(parts.length > 1 ? parts.pop() || '' : '', 80);
    data.firstName = limit(parts.join(' ') || formattedName, 80);
  }

  data.organization = limit(splitEscaped(getFirst(lines, 'ORG')?.value || '', ';')[0]?.trim() || '', 120);
  data.title = limit(unescapeText(getFirst(lines, 'TITLE')?.value || '').trim(), 120);
  data.email = limit(unescapeText(getFirst(lines, 'EMAIL')?.value || '').trim(), 254);
  data.website = limit(unescapeText(getFirst(lines, 'URL')?.value || '').trim(), 300);
  data.note = limit(unescapeText(getFirst(lines, 'NOTE')?.value || '').trim(), 500);

  lines.filter((line) => line.name === 'TEL').forEach((line) => {
    const value = unescapeText(line.value).replace(/^tel:/i, '').trim();
    const type = `${line.parameters.get('TYPE') || ''};${line.rawProperty}`.toUpperCase();
    if (type.includes('CELL') && !data.mobile) data.mobile = limit(value, 50);
    else if (!data.phone) data.phone = limit(value, 50);
  });

  const addressLine = getFirst(lines, 'ADR');
  if (addressLine) {
    const [postOffice = '', extended = '', street = '', city = '', state = '', zip = '', country = ''] = splitEscaped(addressLine.value, ';');
    data.street = limit(street.trim(), 160);
    data.addressLine2 = limit([postOffice, extended].filter(Boolean).join(', ').trim(), 120);
    data.city = limit(city.trim(), 100);
    data.state = limit(state.trim(), 100);
    data.zip = limit(zip.trim(), 30);
    data.country = limit(country.trim(), 100);
  }

  if (![data.firstName, data.lastName, data.organization].some(Boolean)) {
    throw new Error('The vCard does not contain a usable name or organization.');
  }

  return data;
};

const parseReminder = (value: string): number | null => {
  if (/^PT0M$/i.test(value)) return 0;
  const day = /^-P(\d+)D$/i.exec(value);
  if (day) return Number(day[1]) * 24 * 60;
  const hour = /^-PT(\d+)H$/i.exec(value);
  if (hour) return Number(hour[1]) * 60;
  const minute = /^-PT(\d+)M$/i.exec(value);
  if (minute) return Number(minute[1]);
  return null;
};

const parseEvent = (allLines: ParsedLine[]): EventData => {
  const initial = createInitialEventData();
  const data = { ...initial };
  const startIndex = allLines.findIndex((line) => line.name === 'BEGIN' && line.value.toUpperCase() === 'VEVENT');
  const endIndex = allLines.findIndex((line, index) => index > startIndex && line.name === 'END' && line.value.toUpperCase() === 'VEVENT');
  const lines = startIndex >= 0 ? allLines.slice(startIndex + 1, endIndex > startIndex ? endIndex : undefined) : allLines;

  data.title = limit(unescapeText(getFirst(lines, 'SUMMARY')?.value || '').trim(), 160);
  data.location = limit(unescapeText(getFirst(lines, 'LOCATION')?.value || '').trim(), 220);
  data.description = limit(unescapeText(getFirst(lines, 'DESCRIPTION')?.value || '').trim(), 750);
  data.url = limit(unescapeText(getFirst(lines, 'URL')?.value || '').trim(), 300);
  data.uid = limit(unescapeText(getFirst(lines, 'UID')?.value || '').trim(), 255) || initial.uid;

  const timestamp = parseUtcDateTime(getFirst(lines, 'DTSTAMP')?.value || '');
  if (timestamp) data.createdAt = timestamp.toISOString();

  const start = getFirst(lines, 'DTSTART');
  const end = getFirst(lines, 'DTEND');
  if (!start) throw new Error('The calendar event does not contain a start date.');

  data.allDay = start.parameters.get('VALUE')?.toUpperCase() === 'DATE' || /^\d{8}$/.test(start.value);

  if (data.allDay) {
    data.startTime = parseDateOnly(start.value);
    data.endTime = end ? shiftDate(parseDateOnly(end.value), -1) : data.startTime;
  } else {
    const timezone = start.parameters.get('TZID');
    if (timezone) data.timezone = timezone;

    const startUtc = parseUtcDateTime(start.value);
    const endUtc = end ? parseUtcDateTime(end.value) : null;
    data.startTime = startUtc ? formatLocalDateTime(startUtc) : parseBasicDateTime(start.value);
    data.endTime = endUtc
      ? formatLocalDateTime(endUtc)
      : end
        ? parseBasicDateTime(end.value)
        : addMinutes(data.startTime, 60);
  }

  const trigger = getFirst(lines, 'TRIGGER');
  data.reminderMinutes = trigger ? parseReminder(trigger.value) : null;

  if (!data.title) throw new Error('The calendar event does not contain a title.');
  if (!data.startTime || !data.endTime) throw new Error('The calendar event contains an unsupported date format.');
  return data;
};

export const parseGeneratorFile = (content: string): ImportedGeneratorData => {
  const normalized = content.replace(/^\uFEFF/, '').trim();
  if (!normalized) throw new Error('The selected file is empty.');

  const rawLines = unfoldLines(normalized);
  const lines = rawLines.map(parseLine).filter((line): line is ParsedLine => Boolean(line));
  const upperContent = normalized.toUpperCase();

  if (upperContent.includes('BEGIN:VCARD')) {
    return { mode: 'contact', contact: parseContact(lines) };
  }

  if (upperContent.includes('BEGIN:VCALENDAR') || upperContent.includes('BEGIN:VEVENT')) {
    return { mode: 'event', event: parseEvent(lines) };
  }

  throw new Error('Choose a valid VCF contact file or ICS calendar file.');
};
