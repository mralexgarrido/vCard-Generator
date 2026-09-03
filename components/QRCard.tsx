import { useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  AlertTriangle,
  AlignLeft,
  ArrowUp,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileDown,
  Image as ImageIcon,
  MapPin,
  Palette,
  QrCode,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { ContactData, EventData, QrMode } from '../types';
import { generateVCalendarString } from '../utils/calendarHelper';
import {
  getByteLength,
  MAX_QR_BYTES,
  QR_WARNING_BYTES,
  validateContact,
  validateEvent,
} from '../utils/validation';
import { generateVCardString } from '../utils/vcardHelper';

interface QRCardProps {
  data: ContactData | EventData;
  mode: QrMode;
}

type QrLevel = 'M' | 'Q' | 'H';

const colorOptions = [
  { name: 'Slate', value: '#0f172a' },
  { name: 'Black', value: '#000000' },
  { name: 'Navy', value: '#1e3a8a' },
  { name: 'Forest', value: '#14532d' },
  { name: 'Burgundy', value: '#7f1d1d' },
];

const pngSizeOptions = [
  { label: '600 px', value: 600 },
  { label: '1200 px', value: 1200 },
  { label: '2400 px', value: 2400 },
];

const qrLevelByteLimits: Record<QrLevel, number> = {
  M: MAX_QR_BYTES,
  Q: 1_450,
  H: 1_100,
};

const sanitizeFilename = (value: string, fallback: string) => {
  const filename = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return filename || fallback;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};

const QRCard = ({ data, mode }: QRCardProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [qrColor, setQrColor] = useState('#0f172a');
  const [qrLevel, setQrLevel] = useState<QrLevel>('M');
  const [pngSize, setPngSize] = useState(1200);

  const output = useMemo(() => {
    const errors = mode === 'contact'
      ? validateContact(data as ContactData)
      : validateEvent(data as EventData);

    if (errors.length) return { payload: '', bytes: 0, errors };

    try {
      const payload = mode === 'contact'
        ? generateVCardString(data as ContactData)
        : generateVCalendarString(data as EventData);
      const bytes = getByteLength(payload);
      const sizeErrors = bytes > MAX_QR_BYTES
        ? ['This QR code contains too much data. Shorten the notes, description, or URL.']
        : [];

      return { payload, bytes, errors: sizeErrors };
    } catch (error) {
      return {
        payload: '',
        bytes: 0,
        errors: [error instanceof Error ? error.message : 'The QR code could not be generated.'],
      };
    }
  }, [data, mode]);

  const levelErrors = output.payload && output.errors.length === 0 && output.bytes > qrLevelByteLimits[qrLevel]
    ? ['This payload is too large for the selected error correction. Choose Balanced or shorten the content.']
    : [];
  const displayErrors = [...output.errors, ...levelErrors];
  const isReady = displayErrors.length === 0 && Boolean(output.payload);
  const isDense = isReady && output.bytes > QR_WARNING_BYTES;

  const basename = mode === 'contact'
    ? sanitizeFilename(
      [(data as ContactData).firstName, (data as ContactData).lastName].filter(Boolean).join(' ')
        || (data as ContactData).organization,
      'contact',
    )
    : sanitizeFilename((data as EventData).title, 'event');

  const announceDownload = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(''), 3_000);
  };

  const buildExportSvg = () => {
    const source = qrRef.current?.querySelector('svg');
    if (!source) return null;

    const viewBox = source.getAttribute('viewBox')?.split(/\s+/).map(Number) || [0, 0, 256, 256];
    const [minX, minY, width, height] = viewBox;
    const padding = Math.max(width, height) * 0.1;
    const namespace = 'http://www.w3.org/2000/svg';
    const wrapper = document.createElementNS(namespace, 'svg');

    wrapper.setAttribute('xmlns', namespace);
    wrapper.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`);
    wrapper.setAttribute('width', '1024');
    wrapper.setAttribute('height', '1024');
    wrapper.setAttribute('shape-rendering', 'crispEdges');

    const background = document.createElementNS(namespace, 'rect');
    background.setAttribute('x', String(minX - padding));
    background.setAttribute('y', String(minY - padding));
    background.setAttribute('width', String(width + padding * 2));
    background.setAttribute('height', String(height + padding * 2));
    background.setAttribute('fill', '#ffffff');
    wrapper.appendChild(background);

    [...source.childNodes].forEach((child) => wrapper.appendChild(child.cloneNode(true)));
    return new XMLSerializer().serializeToString(wrapper);
  };

  const downloadQrSvg = () => {
    const svg = buildExportSvg();
    if (!svg) return;
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${basename}-qr.svg`);
    announceDownload('QR SVG downloaded.');
  };

  const downloadQrPng = () => {
    const svg = buildExportSvg();
    if (!svg) return;

    const sourceUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pngSize;
      canvas.height = pngSize;
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(sourceUrl);
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${basename}-qr.png`);
          announceDownload('QR PNG downloaded.');
        }
        URL.revokeObjectURL(sourceUrl);
      }, 'image/png');
    };

    image.onerror = () => URL.revokeObjectURL(sourceUrl);
    image.src = sourceUrl;
  };

  const downloadDataFile = () => {
    if (!isReady) return;

    const isContact = mode === 'contact';
    const extension = isContact ? 'vcf' : 'ics';
    const mime = isContact ? 'text/vcard;charset=utf-8' : 'text/calendar;charset=utf-8';
    downloadBlob(new Blob([output.payload], { type: mime }), `${basename}.${extension}`);
    announceDownload(`${isContact ? 'Contact' : 'Calendar'} file downloaded.`);
  };

  const copyData = async () => {
    if (!isReady) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(output.payload);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = output.payload;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand('copy');
        textArea.remove();
        if (!copied) throw new Error('Copy is not supported.');
      }
      announceDownload(`${mode === 'contact' ? 'vCard' : 'Calendar'} data copied.`);
    } catch {
      announceDownload('Copy failed. Use the downloaded source file instead.');
    }
  };

  const renderContactPreview = (contact: ContactData) => {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Contact name';
    const role = contact.title || 'Job title';
    const company = contact.organization || 'Organization';

    return (
      <div aria-hidden="true" className="w-full transition-transform duration-300 motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.01]">
        <div className="relative flex aspect-[1.75/1] w-full flex-col justify-between overflow-hidden rounded-2xl border border-brand-400/50 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-6 text-white shadow-2xl shadow-brand-600/25 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-[0.08] blur-[60px]" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-brand-950 opacity-30 blur-[40px]" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-2xl font-bold tracking-tight drop-shadow-sm sm:text-3xl">{fullName}</h3>
                <p className="mt-1 truncate text-sm font-medium text-brand-50 opacity-90 sm:text-base">{role}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-2">
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
            </div>
            <p className="mt-4 truncate text-xs font-semibold uppercase tracking-wider text-brand-100">{company}</p>
          </div>

          <div className="relative z-10 space-y-1.5 text-xs text-white/90 sm:text-sm">
            {contact.email && <p className="truncate"><span className="mr-3 text-[10px] font-bold uppercase tracking-wider opacity-60">Email</span>{contact.email}</p>}
            {(contact.mobile || contact.phone) && <p className="truncate"><span className="mr-3 text-[10px] font-bold uppercase tracking-wider opacity-60">Phone</span>{contact.mobile || contact.phone}</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderEventPreview = (event: EventData) => {
    const [date = '', time = ''] = event.startTime.split('T');
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date();
    const month = safeDate.toLocaleString(undefined, { month: 'short' }).toUpperCase();
    const day = safeDate.getDate();
    const displayTime = event.allDay
      ? 'All day'
      : time
        ? new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'Time';

    return (
      <div aria-hidden="true" className="w-full transition-transform duration-300 motion-safe:hover:rotate-1 motion-safe:hover:scale-[1.01]">
        <div className="flex aspect-[1.75/1] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="h-2 w-full bg-brand-600" />
          <div className="relative flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex items-start gap-5 pl-1">
              <div className="flex min-w-[68px] flex-col items-center justify-center rounded-xl border border-brand-100 bg-brand-50 p-3 text-brand-700">
                <span className="text-xs font-bold tracking-widest">{month}</span>
                <span className="mt-1 text-3xl font-black leading-none">{day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-xl font-bold leading-tight text-slate-900">{event.title || 'Event title'}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <Clock size={14} className="text-brand-600" />
                  {displayTime}
                </p>
              </div>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 gap-2 pl-1">
              <AlignLeft size={14} className="mt-1 shrink-0 text-slate-400" />
              <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                {event.description || 'Add a short event description.'}
              </p>
            </div>

            <div className="mt-auto border-t-2 border-dashed border-slate-100 pt-3 pl-1">
              <p className="flex items-start gap-2.5 truncate text-sm font-medium text-slate-700">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
                {event.location || 'Location'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside id="qr-output" className="scroll-mt-28 space-y-7 lg:sticky lg:top-24" aria-label="Generated QR code and downloads">
      <a
        href="#details-form"
        className="inline-flex items-center gap-1.5 rounded-lg text-xs font-bold text-brand-800 underline decoration-brand-300 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 lg:hidden"
      >
        <ArrowUp aria-hidden="true" size={14} />
        Back to fields
      </a>
      {mode === 'contact'
        ? renderContactPreview(data as ContactData)
        : renderEventPreview(data as EventData)}

      <section className="flex flex-col items-center gap-6 rounded-2xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-md sm:p-8">
        <div className="text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
            <Smartphone aria-hidden="true" size={14} />
            Scan to save {mode === 'contact' ? 'contact' : 'event'}
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-600">Open a phone camera and point it at the code.</p>
        </div>

        <div
          ref={qrRef}
          className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          role={isReady ? 'img' : undefined}
          aria-label={isReady ? `QR code containing a ${mode === 'contact' ? 'contact card' : 'calendar event'}` : undefined}
        >
          {isReady ? (
            <QRCode
              value={output.payload}
              size={224}
              level={qrLevel}
              fgColor={qrColor}
              bgColor="#ffffff"
              style={{ display: 'block', height: 'auto', maxWidth: '100%', width: '100%' }}
            />
          ) : (
            <div className="flex aspect-square w-56 max-w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
              <div className="rounded-full bg-white p-3 shadow-sm">
                <QrCode aria-hidden="true" size={28} />
              </div>
              <span className="text-center text-xs font-medium">Complete the required details</span>
            </div>
          )}
        </div>

        <div className="w-full" aria-live="polite">
          {displayErrors.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle aria-hidden="true" size={16} />
                Almost ready
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {displayErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          ) : isDense ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle aria-hidden="true" size={16} />
                Dense QR code
              </p>
              <p className="mt-1">It should work, but shorter notes or descriptions will make it easier to scan from print.</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 aria-hidden="true" size={17} />
              Ready to scan
            </div>
          )}

          {isReady && (
            <p className="mt-2 text-center text-xs text-slate-500">
              {output.bytes.toLocaleString()} bytes. Test the final code before printing it.
            </p>
          )}
        </div>

        <details className="group w-full rounded-xl border border-slate-200 bg-slate-50/80">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-800 marker:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20">
            <span className="flex items-center gap-2">
              <Palette aria-hidden="true" size={16} className="text-brand-700" />
              QR appearance and export
            </span>
            <span aria-hidden="true" className="text-xs text-slate-500 transition group-open:rotate-180">⌄</span>
          </summary>
          <div className="space-y-5 border-t border-slate-200 px-4 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Color</p>
              <div className="mt-2 flex flex-wrap gap-2" aria-label="QR code color">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={`${option.name} QR color`}
                    aria-pressed={qrColor === option.value}
                    title={option.name}
                    onClick={() => setQrColor(option.value)}
                    className={`h-9 w-9 rounded-full border-4 shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25 ${qrColor === option.value ? 'border-brand-500 scale-110' : 'border-white hover:scale-105'}`}
                    style={{ backgroundColor: option.value }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Only high-contrast colors are offered to preserve scanning reliability.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                Error correction
                <select
                  value={qrLevel}
                  onChange={(event) => setQrLevel(event.target.value as QrLevel)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/15"
                >
                  <option value="M">Balanced</option>
                  <option value="Q">More resilient</option>
                  <option value="H">Most resilient</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                PNG size
                <select
                  value={pngSize}
                  onChange={(event) => setPngSize(Number(event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/15"
                >
                  {pngSizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">More resilience can help with minor damage or difficult printing, but it also makes the QR pattern denser.</p>
          </div>
        </details>

        <div className="grid w-full grid-cols-1 gap-3">
          <button
            type="button"
            onClick={downloadQrPng}
            disabled={!isReady}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
            <Download aria-hidden="true" size={18} />
            Download QR PNG
          </button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={downloadQrSvg}
              disabled={!isReady}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <ImageIcon aria-hidden="true" size={17} />
              QR SVG
            </button>
            <button
              type="button"
              onClick={downloadDataFile}
              disabled={!isReady}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {mode === 'contact' ? <FileDown aria-hidden="true" size={17} /> : <CalendarCheck aria-hidden="true" size={17} />}
              {mode === 'contact' ? 'Contact .vcf' : 'Calendar .ics'}
            </button>
          </div>
          <button
            type="button"
            onClick={copyData}
            disabled={!isReady}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Copy aria-hidden="true" size={17} />
            Copy {mode === 'contact' ? 'vCard' : 'calendar'} data
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <ShieldCheck aria-hidden="true" size={14} />
          Generated locally. Nothing is uploaded.
        </p>
        {statusMessage && (
          <p className="w-full rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-900" role="status" aria-live="polite">
            {statusMessage}
          </p>
        )}
      </section>
    </aside>
  );
};

export default QRCard;
