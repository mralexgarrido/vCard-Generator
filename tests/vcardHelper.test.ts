import { describe, expect, it } from 'vitest';
import { ContactData } from '../types';
import { generateVCardString } from '../utils/vcardHelper';

const contact = (overrides: Partial<ContactData> = {}): ContactData => ({
  firstName: 'Ana;María',
  lastName: "O'Neil",
  organization: 'Acme, Inc.',
  title: 'Director',
  email: 'ana@example.com',
  phone: '+1 555 010 1111',
  mobile: '+1 555 010 2222',
  website: 'example.com/profile',
  street: '123 Main Street',
  addressLine2: 'Suite 400',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  country: 'United States',
  note: 'Met at an event.\nFollow up next week.',
  ...overrides,
});

describe('generateVCardString', () => {
  it('creates a generic vCard 3.0 with correctly positioned address fields', () => {
    const output = generateVCardString(contact());

    expect(output).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\n');
    expect(output).toContain("N:O'Neil;Ana\\;María;;;\r\n");
    expect(output).toContain("FN:Ana\\;María O'Neil\r\n");
    expect(output).toContain('ORG:Acme\\, Inc.\r\n');
    expect(output).toContain('ADR;TYPE=WORK:;Suite 400;123 Main Street;Austin;TX;78701;United States\r\n');
    expect(output).toContain('NOTE:Met at an event.\\nFollow up next week.\r\n');
    expect(output).toContain('URL:https://example.com/profile\r\n');
    expect(output.endsWith('END:VCARD\r\n')).toBe(true);
  });

  it('uses the organization as the formatted name when no personal name is supplied', () => {
    const output = generateVCardString(contact({
      firstName: '',
      lastName: '',
      organization: 'Community Library',
    }));

    expect(output).toContain('N:;;;;\r\n');
    expect(output).toContain('FN:Community Library\r\n');
  });

  it('folds every physical content line to 75 UTF-8 bytes or fewer', () => {
    const output = generateVCardString(contact({
      note: 'Información útil '.repeat(30),
    }));

    for (const line of output.split('\r\n').filter(Boolean)) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(output).toContain('\r\n ');
  });
});
