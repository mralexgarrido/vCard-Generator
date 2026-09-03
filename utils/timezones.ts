const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Bogota',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export const getSupportedTimezones = (): string[] => {
  try {
    const intlWithSupportedValues = Intl as typeof Intl & {
      supportedValuesOf?: (key: 'timeZone') => string[];
    };
    const supported = intlWithSupportedValues.supportedValuesOf?.('timeZone') || [];
    return [...new Set(['UTC', ...supported])];
  } catch {
    return FALLBACK_TIMEZONES;
  }
};
