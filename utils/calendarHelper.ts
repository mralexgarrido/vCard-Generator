import { EventData } from '../types';

const formatDateTime = (isoString: string): string => {
  if (!isoString) return '';
  // Remove hyphens, colons and milliseconds to get YYYYMMDDThhmmss
  // ISO: 2023-10-24T14:30
  // Required: 20231024T143000
  return isoString.replace(/[-:]/g, '').replace(/\.\d{3}/, '') + '00';
};

const escapeText = (text: string): string => {
  if (!text) return '';
  // Escape special characters as per RFC 5545
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

export const generateVCalendarString = (data: EventData): string => {
  const {
    title,
    location,
    startTime,
    endTime,
    description,
    url,
    timezone
  } = data;

  // UID and DTSTAMP are required for strict iCalendar compliance (especially on iOS)
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${now.getTime()}-${Math.floor(Math.random() * 10000)}@umc.vcard`;

  // Combine Description and URL for better compatibility (e.g. Outlook)
  let fullDescription = description || '';
  if (url) {
    if (fullDescription) fullDescription += '\n\n';
    fullDescription += `Link: ${url}`;
  }

  // Ensure timezone is present, default to UTC if missing (though UI enforces default)
  const tzid = timezone || 'America/Chicago';

  const parts = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UMC//vCard Generator//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${escapeText(title || 'New Event')}`,
  ];

  // Apply Timezone to Start Time
  if (startTime) {
    parts.push(`DTSTART;TZID=${tzid}:${formatDateTime(startTime)}`);
  }

  // Apply Timezone to End Time
  if (endTime) {
    parts.push(`DTEND;TZID=${tzid}:${formatDateTime(endTime)}`);
  }

  if (location) parts.push(`LOCATION:${escapeText(location)}`);
  
  // Use the combined description
  if (fullDescription) parts.push(`DESCRIPTION:${escapeText(fullDescription)}`);
  
  if (url) parts.push(`URL:${url}`);

  parts.push('END:VEVENT');
  parts.push('END:VCALENDAR');

  // Use CRLF (\r\n) for line endings as per RFC 5545
  return parts.join('\r\n');
};