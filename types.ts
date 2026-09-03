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
  city: string;
  state: string;
  zip: string;
  country: string;
  note: string;
  officeLocation: string;
}

export interface EventData {
  title: string;
  location: string;
  startTime: string; // ISO datetime string
  endTime: string;   // ISO datetime string
  description: string;
  url: string;
  timezone: string;
}

export type QrMode = 'contact' | 'event';

export const INITIAL_CONTACT_DATA: ContactData = {
  firstName: '',
  lastName: '',
  organization: '',
  title: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  street: '1201 West University Drive',
  city: 'Edinburg',
  state: 'TX',
  zip: '78539',
  country: 'USA',
  note: '',
  officeLocation: ''
};

// Helper to get local date string for datetime-local input (YYYY-MM-DDTHH:mm)
const getLocalISOString = (date: Date) => {
  const pad = (n: number) => n < 10 ? '0' + n : n;
  return date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes());
};

const now = new Date();
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

export const INITIAL_EVENT_DATA: EventData = {
  title: '',
  location: '',
  startTime: getLocalISOString(now),
  endTime: getLocalISOString(oneHourLater),
  description: '',
  url: '',
  timezone: 'America/Chicago'
};

export enum ParseStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}