import { ContactData, EventData, QrMode } from '../types';
import { generateVCardString } from './vcardHelper';
import { generateVCalendarString } from './calendarHelper';
import { getByteLength, MAX_QR_BYTES, validateContact, validateEvent } from './validation';

export type QrLevel = 'M' | 'Q' | 'H';
export const QR_LIMITS: Record<QrLevel, number> = { M: MAX_QR_BYTES, Q: 1450, H: 1100 };
export interface GeneratedOutput { payload: string; bytes: number; errors: string[] }

/** File validity is independent of QR capacity. Never block a valid VCF/ICS because it is too big for a QR. */
export function buildOutput(data: ContactData | EventData, mode: QrMode): GeneratedOutput {
  try {
    const errors = mode === 'contact' ? validateContact(data as ContactData) : validateEvent(data as EventData);
    if (errors.length) return { payload: '', bytes: 0, errors };
    const payload = mode === 'contact' ? generateVCardString(data as ContactData) : generateVCalendarString(data as EventData);
    return { payload, bytes: getByteLength(payload), errors: [] };
  } catch (error) {
    return { payload: '', bytes: 0, errors: [error instanceof Error ? error.message : 'Check the details and try again.'] };
  }
}

export const canRenderQr = (output: GeneratedOutput, level: QrLevel) =>
  Boolean(output.payload) && output.errors.length === 0 && output.bytes <= QR_LIMITS[level];

export const getDisplayName = (data: ContactData | EventData, mode: QrMode) => mode === 'contact'
  ? [(data as ContactData).firstName, (data as ContactData).lastName].filter(Boolean).join(' ').trim() || (data as ContactData).organization.trim() || 'Your contact card'
  : (data as EventData).title.trim() || 'Your calendar event';

export function sanitizeFilename(value: string, fallback = 'card') {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 100).toLowerCase() || fallback;
}
