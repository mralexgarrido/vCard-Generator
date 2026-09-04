import { describe, expect, it } from 'vitest';
import { createInitialContactData, createInitialEventData } from '../types';
import {
  clearWorkspaceDraft,
  loadWorkspaceDraft,
  saveWorkspaceDraft,
  WORKSPACE_STORAGE_KEY,
} from '../utils/storageHelper';

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

describe('browser workspace storage', () => {
  it('round-trips contact and event drafts with the active mode', () => {
    const storage = createMemoryStorage();
    const contact = {
      ...createInitialContactData(),
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'jordan@example.com',
    };
    const event = {
      ...createInitialEventData(),
      title: 'Community open house',
      reminderMinutes: 30,
    };

    const savedAt = saveWorkspaceDraft({ mode: 'event', contact, event }, storage);
    const restored = loadWorkspaceDraft(storage);

    expect(savedAt).not.toBeNull();
    expect(restored).toEqual({ mode: 'event', contact, event, savedAt });
  });

  it('restores only known fields with safe value types', () => {
    const storage = createMemoryStorage();
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({
      version: 1,
      mode: 'contact',
      savedAt: '2026-09-04T12:00:00.000Z',
      contact: {
        firstName: 'Jordan',
        email: 42,
        unexpected: 'ignored',
      },
      event: {
        title: 'Open house',
        allDay: 'yes',
        reminderMinutes: 999,
      },
    }));

    const restored = loadWorkspaceDraft(storage);

    expect(restored?.contact.firstName).toBe('Jordan');
    expect(restored?.contact.email).toBe('');
    expect(restored?.event.title).toBe('Open house');
    expect(restored?.event.allDay).toBe(false);
    expect(restored?.event.reminderMinutes).toBeNull();
    expect(restored?.contact).not.toHaveProperty('unexpected');
  });

  it('ignores malformed and unsupported saved records', () => {
    const storage = createMemoryStorage();
    storage.setItem(WORKSPACE_STORAGE_KEY, '{not valid json');
    expect(loadWorkspaceDraft(storage)).toBeNull();

    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({
      version: 2,
      mode: 'contact',
      savedAt: '2026-09-04T12:00:00.000Z',
    }));
    expect(loadWorkspaceDraft(storage)).toBeNull();
  });

  it('removes saved data and handles unavailable storage without throwing', () => {
    const storage = createMemoryStorage();
    saveWorkspaceDraft({
      mode: 'contact',
      contact: createInitialContactData(),
      event: createInitialEventData(),
    }, storage);

    expect(clearWorkspaceDraft(storage)).toBe(true);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();

    const unavailableStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };

    expect(loadWorkspaceDraft(unavailableStorage)).toBeNull();
    expect(saveWorkspaceDraft({
      mode: 'contact',
      contact: createInitialContactData(),
      event: createInitialEventData(),
    }, unavailableStorage)).toBeNull();
    expect(clearWorkspaceDraft(unavailableStorage)).toBe(false);
  });
});
