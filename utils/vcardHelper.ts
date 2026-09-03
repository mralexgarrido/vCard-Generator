import { ContactData } from '../types';
import { buildContent, escapeText, sanitizeSingleLine } from './contentLine';
import { normalizeUrl } from './url';

export const generateVCardString = (data: ContactData): string => {
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const organization = data.organization.trim();
  const displayName = [firstName, lastName].filter(Boolean).join(' ')
    || organization
    || 'Contact';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeText(lastName)};${escapeText(firstName)};;;`,
    `FN:${escapeText(displayName)}`,
  ];

  if (organization) lines.push(`ORG:${escapeText(organization)}`);
  if (data.title.trim()) lines.push(`TITLE:${escapeText(data.title.trim())}`);
  if (data.mobile.trim()) lines.push(`TEL;TYPE=CELL:${escapeText(data.mobile.trim())}`);
  if (data.phone.trim()) lines.push(`TEL;TYPE=WORK:${escapeText(data.phone.trim())}`);
  if (data.email.trim()) lines.push(`EMAIL;TYPE=INTERNET:${sanitizeSingleLine(data.email.trim())}`);
  if (data.website.trim()) lines.push(`URL:${sanitizeSingleLine(normalizeUrl(data.website))}`);

  const address = [
    '',
    escapeText(data.addressLine2.trim()),
    escapeText(data.street.trim()),
    escapeText(data.city.trim()),
    escapeText(data.state.trim()),
    escapeText(data.zip.trim()),
    escapeText(data.country.trim()),
  ];

  if (address.slice(1).some(Boolean)) {
    lines.push(`ADR;TYPE=WORK:${address.join(';')}`);
  }

  if (data.note.trim()) lines.push(`NOTE:${escapeText(data.note.trim())}`);
  lines.push('END:VCARD');

  return buildContent(lines);
};
