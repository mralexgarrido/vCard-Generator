import { ContactData } from '../types';
import { isValidWebUrl } from '../utils/url';
import InputField from './InputField';
import TextAreaField from './TextAreaField';

interface ContactFormProps { data: ContactData; onChange: <K extends keyof ContactData>(field: K, value: ContactData[K]) => void }
interface Field { field: keyof ContactData; label: string; name: string; placeholder: string; max: number; autoComplete?: string; type?: string }
const identity: Field[] = [
  { field: 'firstName', label: 'First name', name: 'given-name', placeholder: 'Jordan', max: 80, autoComplete: 'given-name' },
  { field: 'lastName', label: 'Last name', name: 'family-name', placeholder: 'Lee', max: 80, autoComplete: 'family-name' },
  { field: 'organization', label: 'Organization', name: 'organization', placeholder: 'Your company or studio', max: 120, autoComplete: 'organization' },
  { field: 'title', label: 'Job title', name: 'organization-title', placeholder: 'What you do', max: 120, autoComplete: 'organization-title' },
];
const address: Field[] = [
  { field: 'street', label: 'Street address', name: 'street-address', placeholder: '123 Main Street', max: 160, autoComplete: 'address-line1' },
  { field: 'addressLine2', label: 'Suite, unit, or building', name: 'address-line2', placeholder: 'Suite 400', max: 120, autoComplete: 'address-line2' },
  { field: 'city', label: 'City', name: 'city', placeholder: 'City', max: 100, autoComplete: 'address-level2' },
  { field: 'state', label: 'State or province', name: 'state', placeholder: 'State or province', max: 100, autoComplete: 'address-level1' },
  { field: 'zip', label: 'Postal code', name: 'postal-code', placeholder: 'Postal code', max: 30, autoComplete: 'postal-code' },
  { field: 'country', label: 'Country', name: 'country-name', placeholder: 'Country', max: 100, autoComplete: 'country-name' },
];

export default function ContactForm({ data, onChange }: ContactFormProps) {
  const field = (item: Field) => <InputField key={item.field} label={item.label} name={item.name} autoComplete={item.autoComplete} placeholder={item.placeholder} maxLength={item.max} value={data[item.field]} onChange={(event) => onChange(item.field, event.target.value)} />;
  return <div className="space-y-7">
    <fieldset><legend className="mb-2 text-lg font-bold text-slate-900">Who is this card for?</legend><p className="mb-5 text-sm leading-6 text-slate-600">A name or organization is all you need to begin. Everything else is optional.</p><div className="grid gap-5 sm:grid-cols-2">{identity.map(field)}</div></fieldset>
    <fieldset className="border-t border-slate-100 pt-6"><legend className="mb-5 text-lg font-bold text-slate-900">How can people reach you?</legend><div className="grid gap-5 sm:grid-cols-2">
      <InputField label="Email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="jordan@example.com" maxLength={254} value={data.email} onChange={(event) => onChange('email', event.target.value)} error={!data.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ? undefined : 'Enter a valid email address.'} />
      <InputField label="Mobile phone" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 555 010 2020" maxLength={50} value={data.mobile} onChange={(event) => onChange('mobile', event.target.value)} />
      <div className="sm:col-span-2"><InputField label="Website" name="url" inputMode="url" autoComplete="url" placeholder="Your website or professional profile" maxLength={300} value={data.website} onChange={(event) => onChange('website', event.target.value)} error={isValidWebUrl(data.website) ? undefined : 'Enter a valid http or https URL.'} hint="A personal site, portfolio, booking page, or LinkedIn profile works here." /></div>
    </div></fieldset>
    <details className="rounded-xl border border-slate-200" open={Boolean(data.phone || data.note || address.some(({ field }) => data[field])) || undefined}>
      <summary className="disclosure"><span>Address, work phone, and notes <span className="font-normal text-slate-500">(optional)</span></span><span aria-hidden="true">+</span></summary>
      <div className="space-y-6 border-t border-slate-100 p-4 sm:p-5">
        <InputField label="Work phone" name="work-phone" type="tel" inputMode="tel" placeholder="+1 555 010 3030" maxLength={50} value={data.phone} onChange={(event) => onChange('phone', event.target.value)} />
        <fieldset><legend className="mb-4 font-bold text-slate-900">Address</legend><p className="mb-4 text-xs leading-5 text-slate-500">Only include an address you are comfortable distributing.</p><div className="grid gap-5 sm:grid-cols-2">{address.map(field)}</div></fieldset>
        <TextAreaField label="Contact note" name="note" placeholder="A short detail that helps people remember you." maxLength={500} showCount value={data.note} onChange={(event) => onChange('note', event.target.value)} hint="Less text makes a simpler QR. Your notes are included when someone saves the contact." />
      </div>
    </details>
  </div>;
}
