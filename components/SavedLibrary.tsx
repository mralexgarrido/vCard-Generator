import { FormEvent, useEffect, useState } from 'react';
import { Bookmark, Calendar, Copy, Pencil, Trash2, UserRound } from 'lucide-react';
import { ContactData, EventData, QrMode } from '../types';
import { LIBRARY_LIMIT, SavedItem, loadLibrary, saveLibrary, makeSavedItem } from '../utils/libraryHelper';
import { getDisplayName } from '../utils/outputHelper';

interface SavedLibraryProps { mode: QrMode; data: ContactData | EventData; revision: number; onLoad: (item: SavedItem, duplicate: boolean) => void }
export default function SavedLibrary({ mode, data, revision, onLoad }: SavedLibraryProps) {
  const [items, setItems] = useState(loadLibrary);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { setItems(loadLibrary()); setMessage(''); setName(''); }, [revision]);
  function persist(next: SavedItem[]) {
    if (!saveLibrary(next)) { setMessage('Could not save on this browser. Storage may be blocked or full. Export a VCF/ICS file for a portable copy.'); return false; }
    setItems(next); return true;
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const current = loadLibrary();
    if (current.length >= LIBRARY_LIMIT) { setMessage(`Your shelf holds ${LIBRARY_LIMIT} items. Remove one before saving another.`); return; }
    const label = name.trim() || getDisplayName(data, mode);
    if (persist([makeSavedItem(mode, data, label), ...current])) { setName(''); setMessage(`“${label}” saved on this browser.`); }
  }
  function rename(item: SavedItem) {
    const label = window.prompt('Give this saved item a name:', item.name)?.trim();
    if (!label) return;
    if (persist(loadLibrary().map((entry) => entry.id === item.id ? { ...entry, name: label.slice(0, 80) } : entry))) setMessage('Saved item renamed.');
  }
  function remove(item: SavedItem) {
    if (!window.confirm(`Remove “${item.name}” from this browser? Your current editor will not change.`)) return;
    if (persist(loadLibrary().filter((entry) => entry.id !== item.id))) setMessage('Saved item removed.');
  }
  return <details className="panel" id="saved-library">
    <summary className="disclosure"><span className="flex items-center gap-2"><Bookmark size={18} aria-hidden="true" />Your saved cards and events <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{items.length}/{LIBRARY_LIMIT}</span></span><span aria-hidden="true">+</span></summary>
    <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
      <p className="text-sm leading-6 text-slate-600">Keep separate cards for work, personal life, or a side project. Save events you reuse. Stored only in this browser, not synced or encrypted by this app.</p>
      <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-sm font-semibold text-slate-800">Name this saved copy<input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder={getDisplayName(data, mode)} /></label><button type="submit" className="btn btn-primary"><Bookmark size={16} aria-hidden="true" />Save a copy</button></form>
      {items.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Your shelf is empty. Your current draft still autosaves without pressing this button.</p> : <ul className="space-y-2">{items.map((item) => <li key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-600">{item.mode === 'contact' ? <UserRound size={18} aria-hidden="true" /> : <Calendar size={18} aria-hidden="true" />}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.mode === 'contact' ? 'Contact' : 'Event'}</p></div><button className="btn" type="button" onClick={() => onLoad(item, false)} aria-label={`Open ${item.name}`}>Open</button></div><div className="mt-2 flex flex-wrap gap-1 border-t border-slate-100 pt-2"><button className="quiet-btn" type="button" onClick={() => onLoad(item, true)}><Copy size={14} aria-hidden="true" />Use as template</button><button className="quiet-btn" type="button" onClick={() => rename(item)}><Pencil size={14} aria-hidden="true" />Rename<span className="sr-only"> {item.name}</span></button><button className="quiet-btn text-red-700" type="button" onClick={() => remove(item)}><Trash2 size={14} aria-hidden="true" />Remove<span className="sr-only"> {item.name}</span></button></div></li>)}</ul>}
      <p role="status" className="text-sm leading-6 text-slate-700">{message}</p>
    </div>
  </details>;
}
