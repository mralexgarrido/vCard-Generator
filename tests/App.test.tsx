import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../App';
import QRCard from '../components/QRCard';
import { ContactData } from '../types';

describe('App', () => {
  it('renders the browser-private contact workflow without runtime-only dependencies', () => {
    const html = renderToString(<App />);

    expect(html).toContain('Create a QR code');
    expect(html).toContain('Contact card');
    expect(html).toContain('Import VCF or ICS');
    expect(html).toContain('QR appearance and export');
    expect(html).toContain('Generated locally. Nothing is uploaded.');
  });

  it('renders an encoded SVG for a valid contact payload', () => {
    const contact = {
      firstName: 'Jordan',
      lastName: 'Lee',
      organization: 'Northwind Creative',
      title: 'Creative Director',
      email: 'jordan@example.com',
      phone: '',
      mobile: '+1 555 010 2020',
      website: 'example.com',
      street: '',
      addressLine2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      note: '',
    } satisfies ContactData;

    const html = renderToString(<QRCard data={contact} mode="contact" />);

    expect(html).toContain('aria-label="QR code containing a contact card"');
    expect(html).toContain('<svg');
    expect(html).toContain('Download QR PNG');
    expect(html.replaceAll('<!-- -->', '')).toContain('Copy vCard data');
    expect(html).toContain('Error correction');
    expect(html).toContain('PNG size');
  });
});
