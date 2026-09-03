export interface ContactData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  street: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  note: string;
}

export interface EventData {
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  url: string;
  timezone: string;
  allDay: boolean;
  uid: string;
  createdAt: string;
}

export type QrMode = 'contact' | 'event';

const pad = (value: number) => String(value).padStart(2, '0');

const toLocalInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const getLocalTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const createUid = () => {
  const randomId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${randomId}@vcard-qr-generator`;
};

export const createInitialContactData = (): ContactData => ({
  firstName: '',
  lastName: '',
  organization: '',
  title: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  street: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  note: '',
});

export const createInitialEventData = (): EventData => {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    title: '',
    location: '',
    startTime: toLocalInputValue(start),
    endTime: toLocalInputValue(end),
    description: '',
    url: '',
    timezone: getLocalTimezone(),
    allDay: false,
    uid: createUid(),
    createdAt: new Date().toISOString(),
  };
};
