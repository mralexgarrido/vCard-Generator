import { ContactData } from '../types';

export const generateVCardString = (data: ContactData): string => {
  const {
    firstName,
    lastName,
    organization,
    title,
    email,
    phone,
    mobile,
    website,
    street,
    city,
    state,
    zip,
    country,
    note,
    officeLocation
  } = data;

  const parts = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${firstName} ${lastName}`.trim(),
  ];

  if (organization) {
    // Ensure "UTRGV -" prefix is present unless the user already typed it (case-insensitive check)
    const orgValue = organization.trim().toUpperCase().startsWith('UTRGV') 
      ? organization.trim() 
      : `UTRGV - ${organization.trim()}`;
    parts.push(`ORG:${orgValue}`);
  }

  if (title) parts.push(`TITLE:${title}`);
  if (mobile) parts.push(`TEL;TYPE=CELL:${mobile}`);
  if (phone) parts.push(`TEL;TYPE=WORK:${phone}`);
  if (email) parts.push(`EMAIL:${email}`);
  if (website) parts.push(`URL:${website}`);
  
  // Combine Street and Office Location if present
  let fullStreet = street;
  if (officeLocation && officeLocation.trim()) {
      fullStreet = street ? `${street}, ${officeLocation}` : officeLocation;
  }

  const addressParts = [
    '', // Post office box
    '', // Extended address
    fullStreet,
    city,
    state,
    zip,
    country
  ].join(';');
  
  // Only add address if at least one field is filled
  if (addressParts.replace(/;/g, '').length > 0) {
    parts.push(`ADR:;;${addressParts}`);
  }

  if (note) parts.push(`NOTE:${note}`);

  parts.push('END:VCARD');

  return parts.join('\n');
};