import {
  ContactData,
  createInitialContactData,
  createInitialEventData,
  EventData,
  QrMode,
} from '../types';

export const WORKSPACE_STORAGE_KEY = 'vcard-qr-generator:workspace:v1';

const STORAGE_VERSION = 1;
const MAX_STORED_CHARACTERS = 500_000;
const allowedReminderMinutes = new Set([0, 5, 15, 30, 60, 1440]);

const contactFields = [
  'firstName',
  'lastName',
  'organization',
  'title',
  'email',
  'phone',
  'mobile',
  'website',
  'street',
  'addressLine2',
  'city',
  'state',
  'zip',
  'country',
  'note',
] as const satisfies readonly (keyof ContactData)[];

const eventStringFields = [
  'title',
  'location',
  'startTime',
  'endTime',
  'description',
  'url',
  'timezone',
  'uid',
  'createdAt',
] as const satisfies readonly (keyof EventData)[];

interface BrowserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface WorkspaceData {
  mode: QrMode;
  contact: ContactData;
  event: EventData;
}

export interface WorkspaceDraft extends WorkspaceData {
  savedAt: string;
}

interface StoredWorkspaceDraft extends WorkspaceDraft {
  version: typeof STORAGE_VERSION;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getBrowserStorage = (): BrowserStorage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const restoreContact = (value: unknown): ContactData => {
  const contact = createInitialContactData();
  if (!isRecord(value)) return contact;

  for (const field of contactFields) {
    const storedValue = value[field];
    if (typeof storedValue === 'string') contact[field] = storedValue;
  }

  return contact;
};

const restoreEvent = (value: unknown): EventData => {
  const event = createInitialEventData();
  if (!isRecord(value)) return event;

  for (const field of eventStringFields) {
    const storedValue = value[field];
    if (typeof storedValue === 'string') event[field] = storedValue;
  }

  if (typeof value.allDay === 'boolean') event.allDay = value.allDay;
  if (value.reminderMinutes === null) event.reminderMinutes = null;
  if (
    typeof value.reminderMinutes === 'number'
    && allowedReminderMinutes.has(value.reminderMinutes)
  ) {
    event.reminderMinutes = value.reminderMinutes;
  }

  return event;
};

export const loadWorkspaceDraft = (
  storage: BrowserStorage | null = getBrowserStorage(),
): WorkspaceDraft | null => {
  if (!storage) return null;

  try {
    const rawDraft = storage.getItem(WORKSPACE_STORAGE_KEY);
    if (!rawDraft || rawDraft.length > MAX_STORED_CHARACTERS) return null;

    const parsed: unknown = JSON.parse(rawDraft);
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) return null;
    if (parsed.mode !== 'contact' && parsed.mode !== 'event') return null;
    if (
      typeof parsed.savedAt !== 'string'
      || Number.isNaN(Date.parse(parsed.savedAt))
    ) return null;

    return {
      mode: parsed.mode,
      contact: restoreContact(parsed.contact),
      event: restoreEvent(parsed.event),
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
};

export const saveWorkspaceDraft = (
  workspace: WorkspaceData,
  storage: BrowserStorage | null = getBrowserStorage(),
): string | null => {
  if (!storage) return null;

  const savedAt = new Date().toISOString();
  const draft: StoredWorkspaceDraft = {
    version: STORAGE_VERSION,
    ...workspace,
    savedAt,
  };

  try {
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(draft));
    return savedAt;
  } catch {
    return null;
  }
};

export const clearWorkspaceDraft = (
  storage: BrowserStorage | null = getBrowserStorage(),
): boolean => {
  if (!storage) return false;

  try {
    storage.removeItem(WORKSPACE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};
