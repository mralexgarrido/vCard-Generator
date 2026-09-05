import { ChangeEvent, KeyboardEvent, Suspense, lazy, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Calendar, CheckCircle2, FileUp, Github, HardDrive, QrCode, RotateCcw, Share2, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import ContactForm from './components/ContactForm';
import QRCard from './components/QRCard';
import SavedLibrary from './components/SavedLibrary';
import ProgressTrail from './components/ProgressTrail';
import { ContactData, EventData, QrMode, createInitialContactData, createInitialEventData } from './types';
import { parseGeneratorFile } from './utils/importHelper';
import { WorkspaceData } from './utils/storageHelper';
import { duplicateItemData, SavedItem } from './utils/libraryHelper';
import { copyText } from './utils/exportHelper';
import { EVENT_PRESETS, applyEventPreset } from './utils/eventExperience';
import { validateContact, validateEvent } from './utils/validation';
import { useWorkspace } from './hooks/useWorkspace';

const EventForm = lazy(() => import('./components/EventForm'));
const TOOL_URL = 'https://mralexgarrido.github.io/vCard-Generator/';
const FAQs = [
  ['Does this tool upload my contact or event information?', 'No. The browser generates your files and QR codes locally. Drafts and saved copies stay in this browser. The app has no account system, tracking, or server-side storage. Choosing Share sends the selected file through your device sharing menu.'],
  ['Will my work still be here when I return?', 'Your current contact and event drafts save automatically in this browser. Your saved shelf holds up to 12 named copies. This is not a cloud backup: private browsing, clearing site data, changing devices, or browser cleanup can remove it. Export VCF or ICS files for a portable backup.'],
  ['What should I use on the same phone?', 'Download or share the Contact .vcf or Calendar .ics file, then open it with a compatible contacts or calendar app. QR codes are most useful when another device is scanning your screen or printed card.'],
  ['Will the QR code expire or change after I print it?', 'These static codes embed the contact or event data directly, so this app adds no expiration or subscription. Printed codes do not update when you edit a card. Generate and distribute a new code after changing details.'],
  ['Can I bring an existing card or event?', 'Import VCF or ICS files to edit commonly used fields locally. Only a single contact or event is loaded. Recurrence rules, guests, attachments, and advanced vendor-specific fields are not supported; keep your original file when those details matter.'],
  ['Which export should I choose?', 'Use VCF or ICS to save directly on a phone. Use QR PNG in slides or social posts, SVG for sharp print artwork, and the designed-card PNG when you want the name and details beside the code. Print card opens a clean print layout. Test the final code on actual devices before distributing it.'],
  ['How do I remove my information from a shared computer?', 'Open Browser memory and choose Forget saved data. It removes both drafts and every saved copy belonging to this generator. It does not delete files already downloaded or messages already shared. This app does not encrypt browser storage.'],
];

export default function App() {
  const { workspace, update, forget, status, savedAt, restored, remoteClear } = useWorkspace();
  const { mode, contact: contactData, event: eventData } = workspace;
  const activeData = mode === 'contact' ? contactData : eventData;
  const immediatePreview = useMemo(() => ({ mode, data: activeData }), [mode, activeData]);
  const deferredPreview = useDeferredValue(immediatePreview);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [previous, setPrevious] = useState<WorkspaceData | null>(null);
  const [libraryRevision, setLibraryRevision] = useState(0);
  const [exportedFingerprint, setExportedFingerprint] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const fingerprint = JSON.stringify({ mode, data: activeData });
  const exported = fingerprint === exportedFingerprint;
  const errors = useMemo(() => mode === 'contact' ? validateContact(contactData) : validateEvent(eventData), [mode, contactData, eventData]);
  const identified = mode === 'contact' ? Boolean(contactData.firstName.trim() || contactData.lastName.trim() || contactData.organization.trim()) : Boolean(eventData.title.trim());
  const markExported = useCallback(() => setExportedFingerprint(fingerprint), [fingerprint]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => { setNotice(null); setPrevious(null); }, 12000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  useEffect(() => { setPrevious(null); setExportedFingerprint(''); }, [remoteClear]);

  const changeContact = useCallback(<K extends keyof ContactData>(field: K, value: ContactData[K]) => {
    setPrevious(null); update((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));
  }, [update]);
  const changeEvent = useCallback(<K extends keyof EventData>(field: K, value: EventData[K]) => {
    setPrevious(null); update((current) => ({ ...current, event: { ...current.event, [field]: value } }));
  }, [update]);
  function changeMode(next: QrMode) { update((current) => ({ ...current, mode: next })); }
  function tabKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'contact' : event.key === 'End' ? 'event' : mode === 'contact' ? 'event' : 'contact';
    changeMode(next);
    document.getElementById(`tab-${next}`)?.focus();
  }
  function clearCurrent() {
    update((current) => { setPrevious(current); return mode === 'contact' ? { ...current, contact: createInitialContactData() } : { ...current, event: createInitialEventData() }; });
    setNotice({ text: `${mode === 'contact' ? 'Contact' : 'Event'} fields cleared. Your saved shelf is unchanged.` });
  }
  function undo() {
    if (!previous) return;
    const restore = previous; update(() => restore); setPrevious(null); setNotice({ text: 'Previous draft restored.' });
  }
  function loadItem(item: SavedItem, duplicate: boolean) {
    const data = duplicate ? duplicateItemData(item) : item.data;
    update((current) => { setPrevious(current); return item.mode === 'contact' ? { ...current, mode: 'contact', contact: { ...data as ContactData } } : { ...current, mode: 'event', event: { ...data as EventData } }; });
    setNotice({ text: `${duplicate ? 'Template loaded' : 'Opened'}: ${item.name}. Your saved copy stays unchanged until you save another copy.` });
    document.getElementById('details-form')?.scrollIntoView({ block: 'start' });
  }
  function preset(id: string) {
    update((current) => { setPrevious(current); return { ...current, event: applyEventPreset(current.event, id) }; });
    setNotice({ text: 'Duration and reminder updated. Your written details were kept.' });
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 250000) { setNotice({ text: 'Choose a VCF or ICS file smaller than 250 KB.', error: true }); return; }
    try {
      const text = await file.text();
      const imported = parseGeneratorFile(text);
      update((current) => {
        setPrevious(current);
        return { ...current, mode: imported.mode, contact: imported.contact ?? current.contact, event: imported.event ?? current.event };
      });
      const limited = /^(RRULE|ATTENDEE|ATTACH)[;:]/mi.test(text) || (text.match(/^BEGIN:(VCARD|VEVENT)\s*$/gmi)?.length ?? 0) > 1;
      setNotice({ text: `Imported ${file.name}.${limited ? ' One entry loaded. Repeating schedules, guests, and attachments are not carried over. Keep the original file.' : ' Review the details before sharing.'}` });
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : 'Could not import this file.', error: true }); }
  }
  function forgetAll() {
    if (!window.confirm('Remove both drafts and all saved cards and events from this browser? Downloads and files already shared will not be deleted.')) return;
    const removed = forget();
    setPrevious(null); setExportedFingerprint(''); setLibraryRevision((value) => value + 1);
    setNotice({ text: removed ? 'All saved data for this generator was removed from this browser.' : 'The fields were cleared, but some browser storage could not be removed. Clear this site’s data in browser settings.', error: !removed });
  }
  async function shareTool() {
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: 'Free vCard & Event QR Generator', text: 'Make a contact card or event invitation. Free, browser-based, and no account needed.', url: TOOL_URL });
      else await copyText(TOOL_URL);
      setNotice({ text: typeof navigator.share === 'function' ? 'Generator link handed to your device sharing menu. No contact details included.' : 'Generator link copied. No contact or event details are included.' });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setNotice({ text: 'Sharing is unavailable here. You can copy the generator address from your browser.', error: true });
    }
  }
  const storageStatus = status === 'saving' ? 'Saving changes…' : status === 'saved' ? 'Saved on this browser' : status === 'unavailable' ? 'Autosave unavailable. Export a backup.' : 'Autosave is ready';

  return <div className="min-h-screen">
    <a href="#generator" className="skip-link">Skip to generator</a>
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <a href="#generator" className="flex min-w-0 items-center gap-2.5 rounded-lg"><span className="rounded-xl bg-brand-700 p-2.5 text-white"><QrCode size={23} aria-hidden="true" /></span><span><span className="block text-xl font-black tracking-tight text-slate-950">vCard <span className="text-brand-700">QR</span></span><span className="hidden text-xs text-slate-500 sm:block">Contacts. Events. Real connections.</span></span></a>
        <div className="flex items-center gap-2"><button type="button" onClick={shareTool} className="btn" aria-label="Share this free generator"><Share2 size={17} aria-hidden="true" /><span className="hidden sm:inline">Share this tool</span></button><a href="https://github.com/mralexgarrido/vCard-Generator" target="_blank" rel="noreferrer" className="btn" aria-label="View the source code on GitHub"><Github size={19} aria-hidden="true" /></a></div>
      </div>
    </header>
    <main id="generator" className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-6 sm:pt-10 lg:px-8">
      <section className="mb-8 max-w-3xl"><p className="section-kicker">Free to create. Easy to keep. Made to share.</p><h1 className="mt-3 text-balance text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">Create a QR code.<br /><span className="text-brand-700">Make a real connection.</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Your next introduction or invitation, ready to save in a scan. Create a contact card or calendar event without an account, an upload, or a subscription.</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600"><span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-700" aria-hidden="true" />Browser-only by design</span><span className="flex items-center gap-1.5"><HardDrive size={15} aria-hidden="true" />Automatic draft recovery</span><span>VCF · ICS · PNG · SVG</span></div></section>

      <div data-workspace className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
        <div className="min-w-0 space-y-5">
          <div role="tablist" aria-label="Generator type" onKeyDown={tabKeys} className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">{(['contact', 'event'] as const).map((tab) => <button key={tab} id={`tab-${tab}`} type="button" role="tab" aria-controls="editor-panel" aria-selected={mode === tab} tabIndex={mode === tab ? 0 : -1} onClick={() => changeMode(tab)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3.5 text-sm font-bold ${mode === tab ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}>{tab === 'contact' ? <UserRound size={18} aria-hidden="true" /> : <Calendar size={18} aria-hidden="true" />}{tab === 'contact' ? 'Contact card' : 'Calendar event'}</button>)}</div>
          <ProgressTrail mode={mode} identified={identified} valid={errors.length === 0} exported={exported} />
          <section id="details-form" className="panel scroll-mt-5 p-5 sm:p-7" aria-labelledby="form-heading">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 id="form-heading" className="text-xl font-bold text-slate-950">{mode === 'contact' ? 'Contact card' : 'Calendar event'} details</h2><p className="mt-1 text-xs text-slate-500">Your preview updates as you type.</p></div><div className="flex flex-wrap gap-1"><input ref={fileRef} className="hidden" type="file" accept=".vcf,.ics,text/vcard,text/calendar" tabIndex={-1} aria-hidden="true" onChange={importFile} /><button type="button" className="quiet-btn" onClick={() => fileRef.current?.click()}><FileUp size={15} aria-hidden="true" />Import VCF or ICS</button><button type="button" className="quiet-btn" onClick={clearCurrent}><RotateCcw size={15} aria-hidden="true" />Clear current</button></div></div>
            {mode === 'event' && <div className="mb-7"><p className="mb-2 text-xs font-semibold text-slate-600">Optional quick setup. Your written details stay intact.</p><div className="grid gap-2 sm:grid-cols-3">{EVENT_PRESETS.map((item) => <button key={item.id} type="button" onClick={() => preset(item.id)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left hover:border-brand-400"><span className="block text-sm font-bold text-slate-900">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span></button>)}</div></div>}
            <div id="editor-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} tabIndex={0}>{mode === 'contact' ? <ContactForm data={contactData} onChange={changeContact} /> : <Suspense fallback={<p className="py-10 text-sm text-slate-500" role="status">Opening the event editor…</p>}><EventForm data={eventData} onChange={changeEvent} /></Suspense>}</div>
          </section>
          <SavedLibrary mode={mode} data={activeData} revision={libraryRevision + remoteClear} onLoad={loadItem} />
          <details className="panel"><summary className="disclosure"><span className="flex items-center gap-2"><HardDrive size={17} aria-hidden="true" />Browser memory</span><span className={`text-xs ${status === 'unavailable' ? 'text-amber-800' : 'text-slate-500'}`} title={savedAt ? `Last saved ${new Date(savedAt).toLocaleString()}` : undefined}>{storageStatus}</span></summary><div className="space-y-3 border-t border-slate-100 p-5"><p className="text-sm leading-6 text-slate-600">Contact and event drafts stay in this browser only. {restored ? 'Your previous draft was restored. ' : ''}No save button is needed for your current draft. Use your saved shelf for named copies.</p><p className="text-xs leading-5 text-slate-500">Shared computer? Remove your information before leaving. Browser storage is not encrypted by this app and is not a backup.</p><button type="button" onClick={forgetAll} className="btn border-red-200 text-red-800"><Trash2 size={16} aria-hidden="true" />Forget saved data</button></div></details>
        </div>
        <div data-preview-column className="min-w-0 lg:sticky lg:top-5"><QRCard data={deferredPreview.data} mode={deferredPreview.mode} pending={deferredPreview !== immediatePreview} onExport={markExported} /></div>
      </div>

      {exported && <section className="milestone mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950"><CheckCircle2 size={21} aria-hidden="true" />Small card. Real possibilities.</h2><p className="mt-2 text-sm leading-6 text-emerald-900">Try it at your next introduction or event. Know someone who would find this useful?</p></div><button className="btn mt-4 sm:mt-0" type="button" onClick={shareTool}><Share2 size={16} aria-hidden="true" />Share the free generator</button></section>}
      <section className="mt-16 border-t border-slate-200 pt-10" aria-labelledby="uses-heading"><h2 id="uses-heading" className="text-2xl font-bold text-slate-950">One tool. Plenty of reasons to keep it.</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[['Meet someone new', 'Keep a work card and a personal card. Present a large QR on your phone instead of spelling your email aloud.'], ['Fill the calendar, not a form', 'Create invitations for workshops, appointments, celebrations, and open houses. Let people save the date directly.'], ['Put a useful scan anywhere', 'Add QR artwork to slides, email signatures, table displays, or flyers. Export once. Use it where people will see it.']].map(([title, text]) => <article key={title} className="panel p-5"><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></section>
      <section className="mt-12" aria-labelledby="faq-heading"><h2 id="faq-heading" className="text-2xl font-bold text-slate-950">A few good questions</h2><div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">{FAQs.map(([question, answer]) => <details key={question}><summary className="disclosure"><span>{question}</span><span aria-hidden="true">+</span></summary><p className="px-5 pb-5 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></section>
    </main>
    <footer className="border-t border-slate-200 bg-white px-4 py-7 text-center text-xs leading-6 text-slate-500">Built by Alex Garrido. Free and open source. No account. No tracking.<br />Made for real connections, not another subscription.</footer>
    <div className="mobile-action"><span className="min-w-0 text-xs font-semibold text-slate-600">{errors.length === 0 ? 'Your file is ready' : 'Your draft saves automatically'}</span><a href="#qr-output" className="btn btn-primary"><ArrowDown size={16} aria-hidden="true" />Preview & share</a></div>
    <div role={notice?.error ? 'alert' : 'status'} aria-live="polite" className={notice ? `toast ${notice.error ? 'border-red-200' : 'border-slate-200'}` : 'sr-only'}>{notice && <><p className="min-w-0 flex-1 text-sm leading-6 text-slate-800">{notice.text}</p>{previous && <button type="button" className="btn shrink-0" onClick={undo}>Undo</button>}<button type="button" className="quiet-btn shrink-0" aria-label="Dismiss notification" onClick={() => { setNotice(null); setPrevious(null); }}>Close</button></>}</div>
  </div>;
}
