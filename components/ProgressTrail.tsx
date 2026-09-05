import { Check, ArrowRight } from 'lucide-react';
import { QrMode } from '../types';

interface ProgressTrailProps { mode: QrMode; identified: boolean; valid: boolean; exported: boolean }
export default function ProgressTrail({ mode, identified, valid, exported }: ProgressTrailProps) {
  const steps = [{ label: 'Add details', complete: identified }, { label: 'Make it ready', complete: valid }, { label: 'Export or share', complete: exported && valid }];
  const complete = steps.filter((step) => step.complete).length;
  return <section aria-label="Creation progress" className={`rounded-2xl border p-4 sm:p-5 ${complete === 3 ? 'milestone border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-slate-900">{complete === 3 ? 'Ready for a real-world connection.' : valid ? 'Looking good. Put it to work.' : 'A few details. Something worth sharing.'}</p><p className="mt-1 text-xs leading-5 text-slate-600">{complete === 3 ? 'Your export is prepared. Test it once, then make it yours.' : 'Only useful steps. No extra personal details required.'}</p></div><span className="shrink-0 text-sm font-bold text-slate-600">{complete} of 3</span></div>
    <div role="progressbar" aria-label="Creation steps completed" aria-valuemin={0} aria-valuemax={3} aria-valuenow={complete} className="my-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-[width] duration-300 ${complete === 3 ? 'bg-emerald-600' : 'bg-brand-600'}`} style={{ width: `${complete / 3 * 100}%` }} /></div>
    <ol className="grid grid-cols-3 gap-2">{steps.map((step, index) => <li key={step.label} className={`flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${step.complete ? 'text-emerald-800' : 'text-slate-500'}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${step.complete ? 'bg-emerald-100' : 'bg-slate-100'}`}>{step.complete ? <Check size={12} aria-hidden="true" /> : index + 1}</span>{step.label}<span className="sr-only">{step.complete ? ', complete' : ', not yet complete'}</span></li>)}</ol>
    {valid && !exported && <a className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-800" href="#qr-output">Get your {mode === 'contact' ? 'contact card' : 'event invitation'}<ArrowRight size={16} aria-hidden="true" /></a>}
  </section>;
}
