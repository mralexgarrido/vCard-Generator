import { memo, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { ArrowUp, Check, CheckCircle2, Copy, Download, FileDown, Maximize2, Palette, Printer, Share2, ShieldCheck, X, QrCode, LoaderCircle } from 'lucide-react';
import { ContactData, EventData, QrMode } from '../types';
import { QR_WARNING_BYTES } from '../utils/validation';
import { buildOutput, canRenderQr, getDisplayName, QrLevel, sanitizeFilename } from '../utils/outputHelper';
import { copyText, downloadBlob, serializeQr, svgToPng } from '../utils/exportHelper';
import { getEventSummary } from '../utils/eventExperience';

interface QRCardProps {
  data: ContactData | EventData;
  mode: QrMode;
  pending?: boolean;
  onExport?: () => void;
}
const colors = [
  { name: 'Slate', value: '#0f172a' }, { name: 'Black', value: '#000000' },
  { name: 'Navy', value: '#1e3a8a' }, { name: 'Forest', value: '#14532d' }, { name: 'Burgundy', value: '#7f1d1d' },
];

function QRCard({ data, mode, pending = false, onExport }: QRCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('#0f172a');
  const [level, setLevel] = useState<QrLevel>('M');
  const [size, setSize] = useState(1200);
  const [busy, setBusy] = useState(false);
  const [presented, setPresented] = useState(false);
  const [now, setNow] = useState(Date.now);
  const output = useMemo(() => buildOutput(data, mode), [data, mode]);
  const fileReady = Boolean(output.payload) && !output.errors.length && !pending;
  const qrReady = canRenderQr(output, level) && !pending;
  const previewReady = canRenderQr(output, level);
  const name = getDisplayName(data, mode);
  const basename = sanitizeFilename(name, mode);
  const contact = mode === 'contact' ? data as ContactData : null;
  const event = mode === 'event' ? data as EventData : null;
  const summary = useMemo(() => event ? getEventSummary(event, now) : null, [event, now]);
  const subtitle = contact ? [contact.title, contact.organization].filter(Boolean).join(' · ') : summary?.date || 'Choose your date and time';
  const lines = contact
    ? [contact.email, contact.mobile || contact.phone, contact.website].filter(Boolean)
    : [summary?.time || '', event?.location || '', summary?.duration || ''].filter(Boolean);
  const extension = mode === 'contact' ? 'vcf' : 'ics';
  const mime = mode === 'contact' ? 'text/vcard;charset=utf-8' : 'text/calendar;charset=utf-8';

  useEffect(() => {
    if (mode !== 'event') return;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [mode]);
  useEffect(() => () => { if (statusTimer.current) clearTimeout(statusTimer.current); }, []);
  useEffect(() => {
    if (presented && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [presented]);

  function announce(text: string) {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setMessage(text);
    statusTimer.current = setTimeout(() => setMessage(''), 8000);
  }
  function getSvg() {
    const source = qrRef.current?.querySelector('svg');
    if (!source || !qrReady) throw new Error('Finish the details before exporting the QR code.');
    return serializeQr(source);
  }
  function dataFile() { return new File([output.payload], `${basename}.${extension}`, { type: mime }); }
  function downloadFile() {
    if (!fileReady) return;
    downloadBlob(dataFile(), `${basename}.${extension}`);
    announce(`${mode === 'contact' ? 'Contact' : 'Calendar'} file download started.`);
    onExport?.();
  }
  async function exportImage(format: 'png' | 'svg' | 'card') {
    if (!qrReady || busy) return;
    setBusy(true);
    try {
      const qrSvg = getSvg();
      if (format === 'svg') downloadBlob(new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' }), `${basename}-qr.svg`);
      else if (format === 'png') downloadBlob(await svgToPng(qrSvg, size), `${basename}-qr.png`);
      else {
        const { buildCardArtwork } = await import('../utils/cardArtwork');
        const svg = buildCardArtwork({ title: name, subtitle, lines, action: `Scan to save ${mode === 'contact' ? 'my contact' : 'the event'}`, color, qrSvg });
        downloadBlob(await svgToPng(svg, 1080, 1400), `${basename}-${mode === 'contact' ? 'contact-card' : 'event-invite'}.png`);
      }
      announce(`${format === 'card' ? 'Designed card' : `QR ${format.toUpperCase()}`} download started.`);
      onExport?.();
    } catch (error) { announce(error instanceof Error ? error.message : 'Export failed. Try the source file instead.'); }
    finally { setBusy(false); }
  }
  async function shareFile() {
    if (!fileReady || busy) return;
    const file = dataFile();
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        // Keep share() in the click activation. Do not await image generation before opening the share sheet.
        await navigator.share({ files: [file], title: name });
        announce('File handed to your device sharing menu.'); onExport?.();
      } else {
        downloadFile(); announce('File sharing is not available here. Your file download started instead.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      announce('Sharing was unavailable. Use the download file button instead.');
    }
  }
  async function copyData() {
    if (!fileReady) return;
    try { await copyText(output.payload); announce(`${mode === 'contact' ? 'vCard' : 'Calendar'} data copied.`); onExport?.(); }
    catch (error) { announce(error instanceof Error ? error.message : 'Copy failed. Download the source file instead.'); }
  }

  return <aside id="qr-output" className="scroll-mt-24 space-y-4" aria-label="Generated QR code and downloads" aria-busy={pending || busy}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-slate-950">Your {mode === 'contact' ? 'contact card' : 'event invitation'}</h2>
      <a href="#details-form" className="text-sm font-semibold text-brand-800 lg:hidden"><ArrowUp className="inline" size={15} aria-hidden="true" /> Edit</a>
    </div>
    <div data-print-card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
      <div className="p-6 text-white sm:p-7" style={{ backgroundColor: color }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em]">{mode === 'contact' ? 'Make a real connection' : 'Make it onto their calendar'}</p>
        <h3 className="break-words text-2xl font-bold leading-tight sm:text-3xl">{name}</h3>
        {subtitle && <p className="mt-2 break-words text-sm leading-6">{subtitle}</p>}
        {lines.length > 0 && <div className="mt-4 space-y-1.5 border-t border-white/20 pt-4 text-sm">{lines.map((line, index) => <p key={index} className="break-words">{line}</p>)}</div>}
      </div>
      <div className="flex flex-col items-center px-5 pb-6 pt-5">
        <div ref={qrRef} className="w-full max-w-[280px] bg-white p-8" role={previewReady ? 'img' : undefined} aria-label={previewReady ? `QR code containing a ${mode === 'contact' ? 'contact card' : 'calendar event'}` : undefined}>
          {previewReady ? <QRCode value={output.payload} size={240} level={level} fgColor={color} bgColor="#ffffff" style={{ width: '100%', height: 'auto', display: 'block' }} /> : <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50"><div className="text-center"><QrCode className="mx-auto mb-3 text-slate-400" size={40} aria-hidden="true" /><p className="max-w-40 text-sm text-slate-500">Your QR code appears here</p></div></div>}
        </div>
        <p className="font-bold text-slate-900">Scan to save {mode === 'contact' ? 'contact' : 'event'}</p>
        <p className="mt-1 text-center text-xs leading-5 text-slate-500">No special app required for supported camera scanners.</p>
      </div>
    </div>

    <div className="panel p-4 sm:p-5">
      {pending ? <p className="text-sm text-slate-600">Updating preview…</p> : output.errors.length ? <div className="text-sm text-slate-600"><p className="font-semibold text-slate-900">Your next step</p><ul className="mt-1 space-y-1">{output.errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : !previewReady ? <p className="text-sm leading-6 text-amber-950">Too much detail for this QR setting. Shorten the notes or choose Balanced. <strong>Your {extension.toUpperCase()} file is still available below.</strong></p> : <div>
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800"><CheckCircle2 size={17} aria-hidden="true" />{output.bytes > QR_WARNING_BYTES ? 'File ready. QR pattern is dense.' : 'Ready to share'}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{output.bytes > QR_WARNING_BYTES ? 'Shorter notes make a simpler code. Test it at your intended print size.' : 'Test-scan once before printing. A simpler code is easier to scan.'}</p>
      </div>}
      {event && summary?.countdown && <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900">{summary.countdown}</p>}
      {contact && fileReady && ![contact.email, contact.phone, contact.mobile, contact.website].some((value) => value.trim()) && <p className="mt-3 text-xs leading-5 text-slate-600">Optional: add an email, phone, or website so people can reach you. A name-only card is already valid.</p>}
    </div>

    <div className="grid grid-cols-2 gap-2">
      <button type="button" className="btn btn-primary col-span-2" disabled={!fileReady || busy} onClick={shareFile}><Share2 size={18} aria-hidden="true" />Share {mode === 'contact' ? 'contact' : 'event'} file</button>
      <button type="button" className="btn" disabled={!qrReady || busy} onClick={() => exportImage('png')}><Download size={17} aria-hidden="true" />Download QR PNG</button>
      <button type="button" className="btn" disabled={!fileReady || busy} onClick={downloadFile}><FileDown size={17} aria-hidden="true" />{mode === 'contact' ? 'Contact .vcf' : 'Calendar .ics'}</button>
      <button type="button" className="btn col-span-2" disabled={!qrReady || busy} onClick={() => exportImage('card')}>{busy ? <LoaderCircle className="motion-safe:animate-spin" size={17} aria-hidden="true" /> : <Palette size={17} aria-hidden="true" />}Download {mode === 'contact' ? 'designed card' : 'event invitation'} PNG</button>
      <button type="button" className="btn" disabled={!qrReady || busy} onClick={() => setPresented(true)}><Maximize2 size={17} aria-hidden="true" />Present QR</button>
      <button type="button" className="btn" disabled={!qrReady || busy} onClick={() => { window.print(); announce('Print dialog opened.'); }}><Printer size={17} aria-hidden="true" />Print card</button>
    </div>
    <p className="text-center text-xs leading-5 text-slate-500">On this phone? Open the VCF/ICS file. On another phone? Scan the QR.</p>

    <details className="panel group">
      <summary className="disclosure"><span className="flex items-center gap-2"><Palette size={16} aria-hidden="true" />QR appearance and export</span><span aria-hidden="true">+</span></summary>
      <div className="space-y-5 border-t border-slate-100 p-5">
        <div><p className="text-sm font-bold text-slate-800">Card and QR color</p><div className="mt-3 flex flex-wrap gap-2">{colors.map((option) => <button key={option.value} type="button" aria-label={`${option.name} QR color`} aria-pressed={color === option.value} title={option.name} onClick={() => setColor(option.value)} className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white text-white shadow-sm outline outline-1 outline-slate-200" style={{ backgroundColor: option.value }}>{color === option.value && <Check size={19} aria-hidden="true" />}</button>)}</div><p className="mt-2 text-xs text-slate-500">High-contrast colors only. The white scan border always stays intact.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Error correction<select className="field mt-2" value={level} onChange={(event) => setLevel(event.target.value as QrLevel)}><option value="M">Balanced</option><option value="Q">More resilient</option><option value="H">Most resilient</option></select></label>
          <label className="text-sm font-semibold text-slate-700">PNG size<select className="field mt-2" value={size} onChange={(event) => setSize(Number(event.target.value))}>{[600, 1200, 2400].map((value) => <option key={value} value={value}>{value} px</option>)}</select></label>
        </div>
        <p className="text-xs leading-5 text-slate-500">Resilience adds detail to the QR pattern. Designed cards export at 1080 × 1400 px. All exports include the quiet zone.</p>
        <div className="grid gap-2 sm:grid-cols-2"><button className="btn" type="button" disabled={!qrReady || busy} onClick={() => exportImage('svg')}>QR SVG for print</button><button className="btn" type="button" disabled={!fileReady || busy} onClick={copyData}><Copy size={15} aria-hidden="true" />Copy {mode === 'contact' ? 'vCard' : 'calendar'} data</button></div>
        {output.payload && <p className="text-xs text-slate-500">{output.bytes.toLocaleString()} encoded bytes. These static QR codes do not expire, but their details cannot change after printing.</p>}
      </div>
    </details>
    <p className="flex items-center justify-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={14} aria-hidden="true" />Generated locally. Nothing is uploaded.</p>
    <div role="status" aria-live="polite" className={message ? 'rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950' : 'sr-only'}>{message}</div>

    <dialog ref={dialogRef} className="presentation-dialog" aria-labelledby="present-title" onClose={() => setPresented(false)}>
      <div className="flex items-center justify-between gap-3"><h2 id="present-title" className="break-words text-xl font-bold text-slate-950">{name}</h2><button type="button" className="btn shrink-0" aria-label="Close QR presentation" onClick={() => dialogRef.current?.close()} autoFocus><X size={20} aria-hidden="true" /></button></div>
      {presented && previewReady && <div className="mx-auto mt-5 w-full max-w-[480px] bg-white p-8" role="img" aria-label="Enlarged QR code"><QRCode value={output.payload} size={480} level={level} fgColor={color} bgColor="#ffffff" style={{ width: '100%', height: 'auto', display: 'block' }} /></div>}
      <p className="mt-4 text-center font-bold text-slate-900">Scan to save {mode === 'contact' ? 'my contact' : 'the event'}</p><p className="mt-2 text-center text-sm text-slate-600">Ask the other person to open their phone camera.</p>
    </dialog>
  </aside>;
}
export default memo(QRCard);
