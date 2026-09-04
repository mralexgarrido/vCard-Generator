import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  Calendar,
  ChevronDown,
  FileUp,
  Github,
  HardDrive,
  LockKeyhole,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import ContactForm from './components/ContactForm';
import EventForm from './components/EventForm';
import QRCard from './components/QRCard';
import {
  ContactData,
  createInitialContactData,
  createInitialEventData,
  EventData,
  QrMode,
} from './types';
import { parseGeneratorFile } from './utils/importHelper';
import {
  clearWorkspaceDraft,
  loadWorkspaceDraft,
  saveWorkspaceDraft,
} from './utils/storageHelper';

type ClearedData =
  | { mode: 'contact'; data: ContactData }
  | { mode: 'event'; data: EventData };

interface Notice {
  type: 'success' | 'error';
  text: string;
}

type StorageState = 'empty' | 'saving' | 'saved' | 'unavailable';

const formatSavedAt = (value: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

const App = () => {
  const [initialDraft] = useState(loadWorkspaceDraft);
  const [mode, setMode] = useState<QrMode>(initialDraft?.mode ?? 'contact');
  const [contactData, setContactData] = useState<ContactData>(
    () => initialDraft?.contact ?? createInitialContactData(),
  );
  const [eventData, setEventData] = useState<EventData>(
    () => initialDraft?.event ?? createInitialEventData(),
  );
  const [lastCleared, setLastCleared] = useState<ClearedData | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [shouldPersist, setShouldPersist] = useState(Boolean(initialDraft));
  const [storageState, setStorageState] = useState<StorageState>(
    initialDraft ? 'saved' : 'empty',
  );
  const [savedAt, setSavedAt] = useState<string | null>(initialDraft?.savedAt ?? null);
  const [confirmForget, setConfirmForget] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => {
      setNotice(null);
      if (lastCleared) setLastCleared(null);
    }, 8_000);
    return () => window.clearTimeout(timeout);
  }, [lastCleared, notice]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }
    if (!shouldPersist) return undefined;

    setStorageState('saving');
    const workspace = { mode, contact: contactData, event: eventData };
    const persistDraft = (updateStatus: boolean) => {
      const timestamp = saveWorkspaceDraft(workspace);
      if (!updateStatus) return;
      if (timestamp) {
        setSavedAt(timestamp);
        setStorageState('saved');
      } else {
        setStorageState('unavailable');
      }
    };

    const timeout = window.setTimeout(() => persistDraft(true), 350);
    const handlePageHide = () => persistDraft(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistDraft(false);
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [contactData, eventData, mode, shouldPersist]);

  const handleContactChange = <K extends keyof ContactData>(field: K, value: ContactData[K]) => {
    setShouldPersist(true);
    setContactData((previous) => ({ ...previous, [field]: value }));
  };

  const handleEventChange = <K extends keyof EventData>(field: K, value: EventData[K]) => {
    setShouldPersist(true);
    setEventData((previous) => ({ ...previous, [field]: value }));
  };

  const handleModeChange = (nextMode: QrMode) => {
    setShouldPersist(true);
    setMode(nextMode);
  };

  const handleClear = () => {
    setShouldPersist(true);
    setConfirmForget(false);
    if (mode === 'contact') {
      setLastCleared({ mode, data: { ...contactData } });
      setContactData(createInitialContactData());
    } else {
      setLastCleared({ mode, data: { ...eventData } });
      setEventData(createInitialEventData());
    }
    setNotice({ type: 'success', text: `${mode === 'contact' ? 'Contact' : 'Event'} fields cleared.` });
  };

  const handleUndoClear = () => {
    if (!lastCleared) return;
    setShouldPersist(true);
    if (lastCleared.mode === 'contact') setContactData(lastCleared.data);
    else setEventData(lastCleared.data);
    setMode(lastCleared.mode);
    setLastCleared(null);
    setNotice({ type: 'success', text: `${lastCleared.mode === 'contact' ? 'Contact' : 'Event'} fields restored.` });
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 250_000) {
      setNotice({ type: 'error', text: 'Choose a VCF or ICS file smaller than 250 KB.' });
      return;
    }

    try {
      const imported = parseGeneratorFile(await file.text());
      setShouldPersist(true);
      if (imported.mode === 'contact' && imported.contact) setContactData(imported.contact);
      if (imported.mode === 'event' && imported.event) setEventData(imported.event);
      setMode(imported.mode);
      setLastCleared(null);
      setNotice({
        type: 'success',
        text: `${imported.mode === 'contact' ? 'Contact' : 'Event'} imported from ${file.name}.`,
      });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'The selected file could not be imported.',
      });
    }
  };

  const handleForgetSavedData = () => {
    const removed = clearWorkspaceDraft();
    setMode('contact');
    setContactData(createInitialContactData());
    setEventData(createInitialEventData());
    setLastCleared(null);
    setShouldPersist(false);
    setSavedAt(null);
    setStorageState(removed ? 'empty' : 'unavailable');
    setConfirmForget(false);
    setNotice({
      type: removed ? 'success' : 'error',
      text: removed
        ? 'All contact and event information was removed from this browser.'
        : 'The fields were cleared, but browser storage could not be accessed.',
    });
  };

  const storageStatus = storageState === 'saving'
    ? 'Saving changes...'
    : storageState === 'saved'
      ? `Saved on this browser${savedAt ? ` · ${formatSavedAt(savedAt)}` : ''}`
      : storageState === 'unavailable'
        ? 'Browser autosave is unavailable'
        : 'Autosave is ready';

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a
        href="#generator"
        className="sr-only z-50 rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to generator
      </a>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-brand-200/25 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-sky-100/40 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="./" className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25">
            <span className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-2.5 shadow-lg shadow-brand-600/25 transition motion-safe:group-hover:scale-105">
              <QrCode aria-hidden="true" className="text-white" size={24} />
            </span>
            <span className="flex flex-col">
              <span className="text-xl font-bold leading-none tracking-tight text-slate-950">
                vCard <span className="text-brand-700">QR</span>
              </span>
              <span className="mt-1 text-xs font-medium tracking-wide text-slate-500">Contact and event generator</span>
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 md:flex">
              <LockKeyhole aria-hidden="true" size={14} />
              Private by design
            </span>
            <a
              href="https://github.com/mralexgarrido/vCard-Generator"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
              aria-label="View the source code on GitHub"
              title="View on GitHub"
            >
              <Github aria-hidden="true" size={20} />
            </a>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20"
              aria-label={`Clear ${mode} fields`}
              title={`Clear ${mode} fields`}
            >
              <Trash2 aria-hidden="true" size={20} />
              <span className="hidden text-sm font-bold sm:inline">Clear current</span>
            </button>
          </div>
        </div>
      </header>

      <main id="generator" className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <section className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-brand-700">Free, open source, and browser based</p>
          <h1 className="text-balance text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Create a QR code people can actually use
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-8 text-slate-600">
            Turn contact details into a vCard or event details into a calendar file. Download a print-ready QR code without creating an account or uploading personal information.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-2"><ShieldCheck aria-hidden="true" size={17} className="text-emerald-700" />No data collection</span>
            <span className="flex items-center gap-2"><QrCode aria-hidden="true" size={17} className="text-brand-700" />PNG and SVG</span>
            <span className="flex items-center gap-2"><Calendar aria-hidden="true" size={17} className="text-sky-700" />VCF and ICS files</span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 xl:gap-16">
          <section id="details-form" className="scroll-mt-28 space-y-7 lg:col-span-7" aria-labelledby="form-heading">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h2 id="form-heading" className="text-3xl font-bold text-slate-950">
                  {mode === 'contact' ? 'Contact card' : 'Calendar event'}
                </h2>
                <p className="mt-2 font-medium text-slate-600">
                  The QR preview updates as you complete the fields.
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:items-end">
                <div
                  className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1.5 shadow-inner"
                  role="tablist"
                  aria-label="Generator type"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'contact'}
                    onClick={() => handleModeChange('contact')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 sm:px-5 ${mode === 'contact' ? 'bg-white text-brand-700 shadow-md' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}
                  >
                    <UserPlus aria-hidden="true" size={16} />
                    Contact
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'event'}
                    onClick={() => handleModeChange('event')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 sm:px-5 ${mode === 'event' ? 'bg-white text-brand-700 shadow-md' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}
                  >
                    <Calendar aria-hidden="true" size={16} />
                    Event
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.ics,text/vcard,text/calendar"
                    className="hidden"
                    aria-hidden="true"
                    onChange={handleImport}
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                    title="Import an existing contact or calendar event"
                  >
                    <FileUp aria-hidden="true" size={14} />
                    Import VCF or ICS
                  </button>
                  <a
                    href="#qr-output"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 lg:hidden"
                  >
                    <ArrowDown aria-hidden="true" size={14} />
                    View QR
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <HardDrive aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" size={18} />
                <div>
                  <p className="text-sm font-bold text-emerald-950" role="status" aria-live="polite">
                    {storageStatus}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-emerald-900/80">
                    Contact and event drafts stay in this browser only. Nothing is uploaded.
                  </p>
                </div>
              </div>

              {confirmForget ? (
                <div className="flex flex-wrap items-center gap-2 sm:justify-end" role="group" aria-label="Confirm removal of saved data">
                  <span className="w-full text-xs font-semibold text-red-900 sm:w-auto">Remove both drafts?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmForget(false)}
                    className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleForgetSavedData}
                    className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/25"
                  >
                    Forget everything
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmForget(true)}
                  disabled={!shouldPersist && storageState === 'empty'}
                  className="shrink-0 self-start rounded-lg px-3 py-2 text-xs font-bold text-emerald-900 underline decoration-emerald-400 underline-offset-4 transition hover:bg-white hover:text-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                >
                  Forget saved data
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-md sm:p-10">
              {mode === 'contact' ? (
                <ContactForm data={contactData} onChange={handleContactChange} />
              ) : (
                <EventForm data={eventData} onChange={handleEventChange} />
              )}
            </div>
          </section>

          <div className="lg:col-span-5">
            <QRCard data={mode === 'contact' ? contactData : eventData} mode={mode} />
          </div>
        </div>

        <section className="mt-24 border-t border-slate-200 pt-16" aria-labelledby="how-it-works">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="how-it-works" className="text-3xl font-bold tracking-tight text-slate-950">Simple enough for one card. Reliable enough for a campaign.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">The generator creates standards-friendly data, adds a proper quiet zone around each QR code, and keeps the entire process on your device.</p>
          </div>

          <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            {[
              ['1', 'Enter the details', 'Choose contact or event, then complete only the fields you need.'],
              ['2', 'Check the preview', 'Resolve any validation message and test-scan the finished code.'],
              ['3', 'Download and share', 'Use PNG for everyday sharing, SVG for print, or the source VCF or ICS file.'],
            ].map(([number, title, description]) => (
              <li key={number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-800">{number}</span>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-20 max-w-4xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-center text-3xl font-bold tracking-tight text-slate-950">Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {[
              ['Does this tool upload my contact or event information?', 'No. The browser creates the QR code and downloadable files locally. The app has no account system, analytics, cloud database, or server-side processing.'],
              ['How does browser autosave work?', 'The app automatically stores your latest contact and event drafts in this browser so you can return after closing the page. The information is not synced to other browsers or devices. Use “Forget saved data” before leaving a shared computer.'],
              ['What is the difference between VCF and ICS?', 'A VCF file stores contact information. An ICS file stores a calendar event. The QR code contains the same underlying data so compatible phone cameras and scanner apps can offer to save it.'],
              ['Which QR format should I download?', 'PNG works well for presentations, email, and social media. SVG stays sharp at any size and is the better choice for professionally printed materials.'],
              ['Can I edit an existing contact or calendar file?', 'Yes. Import a VCF or ICS file and the generator will load commonly used contact and event fields locally in your browser. The file is never uploaded.'],
              ['Will every camera app behave the same way?', 'No. QR handling varies by device and scanner app. Always test the final code on both iOS and Android before printing or distributing it at scale.'],
            ].map(([question, answer]) => (
              <details key={question} className="group p-6 open:bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-950 marker:hidden">
                  <span>{question}</span>
                  <ChevronDown aria-hidden="true" className="shrink-0 text-brand-700 transition group-open:rotate-180" size={19} />
                </summary>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-slate-600 sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>Built for useful connections. No account, tracking, or data upload.</p>
          <a
            href="https://github.com/mralexgarrido/vCard-Generator"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:text-brand-950"
          >
            View and contribute on GitHub
          </a>
        </div>
      </footer>

      {notice && (
        <div
          className={`fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-2xl ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}
          role={notice.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span className="font-medium">{notice.text}</span>
          {lastCleared && (
            <button
              type="button"
              onClick={handleUndoClear}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
            >
              <RotateCcw aria-hidden="true" size={15} />
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
