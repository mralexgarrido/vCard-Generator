import { ContactData, EventData, QrMode, createInitialContactData, createInitialEventData } from '../types';
import { loadWorkspaceDraft, WORKSPACE_STORAGE_KEY } from './storageHelper';

export const LIBRARY_STORAGE_KEY = 'vcard-qr-generator:library:v1';
export const LIBRARY_LIMIT = 12;
export type SavedItem = { id: string; name: string; savedAt: string } & (
  { mode: 'contact'; data: ContactData } | { mode: 'event'; data: EventData }
);
export interface LocalStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function browserStorage(): LocalStorageLike | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function loadLibrary(storage: LocalStorageLike | null = browserStorage()): SavedItem[] {
  try {
    const raw = storage?.getItem(LIBRARY_STORAGE_KEY);
    if (!raw || raw.length > 500000) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) return [];
    const seen = new Set<string>();
    return parsed.items.slice(0, LIBRARY_LIMIT).flatMap((item: unknown): SavedItem[] => {
      if (!record(item) || typeof item.id !== 'string' || !item.id || item.id.length > 100 || seen.has(item.id)
        || typeof item.name !== 'string' || !item.name.trim() || typeof item.savedAt !== 'string'
        || !Number.isFinite(Date.parse(item.savedAt)) || (item.mode !== 'contact' && item.mode !== 'event') || !record(item.data)
        || JSON.stringify(item.data).length > 50000) return [];
      // Reuse the versioned, allowlisted workspace decoder. Unknown fields never enter application state.
      const draft = loadWorkspaceDraft({ getItem: () => JSON.stringify({ version: 1, savedAt: item.savedAt, mode: item.mode, contact: item.mode === 'contact' ? item.data : {}, event: item.mode === 'event' ? item.data : {} }), setItem: () => {}, removeItem: () => {} });
      if (!draft) return [];
      seen.add(item.id);
      const common = { id: item.id, name: item.name.trim().slice(0, 80), savedAt: item.savedAt };
      return item.mode === 'contact' ? [{ ...common, mode: 'contact', data: draft.contact }] : [{ ...common, mode: 'event', data: draft.event }];
    });
  } catch { return []; }
}

export function saveLibrary(items: SavedItem[], storage: LocalStorageLike | null = browserStorage()): boolean {
  if (!storage || items.length > LIBRARY_LIMIT) return false;
  try {
    const serialized = JSON.stringify({ version: 1, items });
    if (serialized.length > 500000) return false;
    storage.setItem(LIBRARY_STORAGE_KEY, serialized);
    return true;
  } catch { return false; }
}

export function makeSavedItem(mode: QrMode, data: ContactData | EventData, name: string): SavedItem {
  const common = { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: name.trim().slice(0, 80) || 'Untitled', savedAt: new Date().toISOString() };
  return mode === 'contact' ? { ...common, mode, data: { ...(data as ContactData) } } : { ...common, mode, data: { ...(data as EventData) } };
}

export function duplicateItemData(item: SavedItem): ContactData | EventData {
  if (item.mode === 'contact') return { ...createInitialContactData(), ...item.data };
  const fresh = createInitialEventData();
  return { ...item.data, uid: fresh.uid, createdAt: fresh.createdAt };
}

/** Remove only this app's keys. Other apps on the same github.io origin are never cleared. */
export function clearGeneratorStorage(storage: LocalStorageLike | null = browserStorage()): boolean {
  if (!storage) return false;
  let success = true;
  for (const key of [WORKSPACE_STORAGE_KEY, LIBRARY_STORAGE_KEY]) {
    try { storage.removeItem(key); } catch { success = false; }
  }
  return success;
}
