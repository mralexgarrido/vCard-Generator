import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialContactData, createInitialEventData } from '../types';
import { buildOutput, canRenderQr, sanitizeFilename } from '../utils/outputHelper';
import { applyEventPreset, getEventSummary } from '../utils/eventExperience';
import { buildCardArtwork, escapeXml, wrapLines } from '../utils/cardArtwork';
import { clearGeneratorStorage, duplicateItemData, LIBRARY_LIMIT, LIBRARY_STORAGE_KEY, loadLibrary, makeSavedItem, saveLibrary } from '../utils/libraryHelper';
import { WORKSPACE_STORAGE_KEY } from '../utils/storageHelper';
import ProgressTrail from '../components/ProgressTrail';
import QRCard from '../components/QRCard';

const memory = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
};
const contact = () => ({ ...createInitialContactData(), firstName: 'Jordan', email: 'jordan@example.com' });
const event = () => ({ ...createInitialEventData(), title: 'Open house', startTime: '2026-09-09T10:00', endTime: '2026-09-09T11:00', timezone: 'America/Chicago' });

 describe('share-ready output', () => {
  it('keeps large valid source files available independently of QR limits', () => {
    const data = { ...contact(), note: '界'.repeat(900) };
    const output = buildOutput(data, 'contact');
    expect(output.errors).toEqual([]);
    expect(output.payload).toContain('BEGIN:VCARD');
    expect(canRenderQr(output, 'M')).toBe(false);
    const html = renderToString(<QRCard data={data} mode="contact" />);
    expect(html).toContain('file is still available below');
    const fileButton = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find((match) => match[2].includes('Contact .vcf'));
    expect(fileButton).toBeDefined();
    expect(fileButton?.[1]).not.toContain('disabled');
  });
  it('validates fields before offering files or QR codes', () => {
    expect(buildOutput({ ...contact(), email: 'bad' }, 'contact').payload).toBe('');
    expect(buildOutput({ ...event(), endTime: '2026-09-09T09:00' }, 'event').payload).toBe('');
  });
  it('supports a name-only card without collecting more personal data', () => {
    expect(buildOutput({ ...createInitialContactData(), firstName: 'Ana' }, 'contact').errors).toEqual([]);
  });
  it('sanitizes filenames and handles names outside the Latin alphabet', () => {
    expect(sanitizeFilename('José / Card')).toBe('jose-card');
    expect(sanitizeFilename('名', 'contact')).toBe('contact');
  });
  it('does not display export completion after a validation failure', () => {
    const html = renderToString(<ProgressTrail mode="contact" identified valid={false} exported />);
    expect(html).toContain('aria-valuenow="1"');
  });
  it('renders accessible sharing and presentation controls', () => {
    const html = renderToString(<QRCard data={contact()} mode="contact" />).replaceAll('<!-- -->', '');
    for (const label of ['Share contact file', 'Download designed card PNG', 'Present QR', 'Print card', 'Close QR presentation']) expect(html).toContain(label);
  });
});

 describe('saved shelf and privacy', () => {
  it('round trips both kinds of saved items', () => {
    const storage = memory();
    const items = [makeSavedItem('contact', contact(), 'Work'), makeSavedItem('event', event(), 'Open house')];
    expect(saveLibrary(items, storage)).toBe(true);
    expect(loadLibrary(storage)).toEqual(items);
  });
  it('ignores malformed, oversized, and future-version storage safely', () => {
    const storage = memory();
    for (const value of ['{bad', JSON.stringify({ version: 2, items: [] }), 'x'.repeat(500001)]) { storage.setItem(LIBRARY_STORAGE_KEY, value); expect(loadLibrary(storage)).toEqual([]); }
    storage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({ version: 1, items: [{ mode: 'contact', name: 'Broken', id: '1', savedAt: 'bad', data: {} }] }));
    expect(loadLibrary(storage)).toEqual([]);
  });
  it('returns failure when storage is blocked or full', () => {
    expect(saveLibrary([], null)).toBe(false);
    expect(saveLibrary([], { ...memory(), setItem: () => { throw new Error('quota'); } })).toBe(false);
    expect(loadLibrary({ ...memory(), getItem: () => { throw new Error('blocked'); } })).toEqual([]);
  });
  it('limits the shelf without silently evicting saved items', () => {
    const storage = memory();
    const item = makeSavedItem('contact', contact(), 'Card');
    expect(saveLibrary(Array.from({ length: LIBRARY_LIMIT + 1 }, () => item), storage)).toBe(false);
  });
  it('strips unknown fields and invalid field types when restoring', () => {
    const storage = memory();
    const item = makeSavedItem('contact', contact(), 'Card');
    storage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({ version: 1, items: [{ ...item, data: { ...item.data, firstName: 42, secret: 'ignored' } }] }));
    const [loaded] = loadLibrary(storage);
    expect(loaded.mode === 'contact' && loaded.data.firstName).toBe('');
    expect(loaded.data).not.toHaveProperty('secret');
  });
  it('removes this generator only, preserving other apps on the same origin', () => {
    const storage = memory();
    storage.setItem(WORKSPACE_STORAGE_KEY, 'draft'); storage.setItem(LIBRARY_STORAGE_KEY, 'shelf'); storage.setItem('another-app', 'keep');
    expect(clearGeneratorStorage(storage)).toBe(true);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull(); expect(storage.getItem(LIBRARY_STORAGE_KEY)).toBeNull(); expect(storage.getItem('another-app')).toBe('keep');
  });
  it('gives an event template a fresh calendar identity', () => {
    const original = makeSavedItem('event', event(), 'Template');
    const copy = duplicateItemData(original);
    expect('uid' in copy && 'uid' in original.data && copy.uid !== original.data.uid).toBe(true);
    expect(copy.title).toBe(original.data.title);
  });
});

 describe('event setup and timeline', () => {
  it('preserves entered details and timezone while updating duration and reminder', () => {
    const source = { ...event(), location: 'My venue', description: 'Do not replace me' };
    const next = applyEventPreset(source, 'workshop');
    expect(next.endTime).toBe('2026-09-09T12:00'); expect(next.reminderMinutes).toBe(30);
    for (const key of ['title', 'location', 'description', 'timezone', 'uid'] as const) expect(next[key]).toBe(source[key]);
  });
  it('converts an all-day preset to timed without shifting the selected date', () => {
    const next = applyEventPreset({ ...event(), allDay: true, startTime: '2026-12-31', endTime: '2026-12-31' }, 'meeting');
    expect(next.allDay).toBe(false); expect(next.startTime).toBe('2026-12-31T09:00'); expect(next.endTime).toBe('2026-12-31T09:30');
  });
  it('leaves invalid start values untouched', () => { const data = { ...event(), startTime: '' }; expect(applyEventPreset(data, 'meeting')).toBe(data); });
  it('handles future, ongoing, and finished events in their timezone', () => {
    const data = event();
    expect(getEventSummary(data, Date.parse('2026-09-09T14:30:00Z'))?.countdown).toBe('Starts in 30 min');
    expect(getEventSummary(data, Date.parse('2026-09-09T15:30:00Z'))?.countdown).toBe('Happening now');
    expect(getEventSummary(data, Date.parse('2026-09-09T16:00:00Z'))?.countdown).toBe('Event has ended');
  });
  it('uses inclusive all-day dates and rejects invalid timeline inputs', () => {
    expect(getEventSummary({ ...event(), allDay: true, startTime: '2026-12-31', endTime: '2027-01-01' })?.duration).toBe('2 days');
    expect(getEventSummary({ ...event(), timezone: 'Not/AZone' })).toBeNull();
  });
  it('calculates elapsed time across daylight-saving changes', () => {
    const summary = getEventSummary({ ...event(), startTime: '2026-03-08T01:30', endTime: '2026-03-08T03:30' });
    expect(summary?.duration).toBe('1 hr');
  });
});

 describe('safe card artwork', () => {
  it('escapes user text instead of interpolating executable markup', () => {
    const svg = buildCardArtwork({ title: '<script>alert("x")</script>', subtitle: 'A & B', lines: ['<image href="evil">'], action: 'Scan & save', color: 'url(javascript:bad)', qrSvg: '<svg width="41" height="41" viewBox="0 0 41 41"></svg>' });
    expect(svg).not.toContain('<script>'); expect(svg).not.toContain('<image'); expect(svg).not.toContain('javascript:'); expect(svg).toContain('A &amp; B'); expect(svg).toContain('width="600"');
  });
  it('bounds long visible text while keeping XML safe', () => {
    expect(wrapLines('a'.repeat(200), 30, 3)).toHaveLength(3);
    expect(wrapLines('a'.repeat(200), 30, 3)[2]).toContain('…');
    expect(escapeXml('"&<>')).toBe('&quot;&amp;&lt;&gt;');
  });
});
