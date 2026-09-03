import { ChangeEvent } from 'react';
import { Building2, FileText, Globe, Mail, MapPin, Phone, User } from 'lucide-react';
import { ContactData } from '../types';
import { isValidWebUrl } from '../utils/url';
import InputField from './InputField';
import TextAreaField from './TextAreaField';

interface ContactFormProps {
  data: ContactData;
  onChange: <K extends keyof ContactData>(field: K, value: ContactData[K]) => void;
}

const emailIsValid = (value: string) =>
  !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const ContactForm = ({ data, onChange }: ContactFormProps) => {
  const handleChange = (field: keyof ContactData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(field, event.target.value);
    };

  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <User aria-hidden="true" className="text-brand-600" size={20} />
          Name
        </legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputField
            label="First name"
            name="given-name"
            autoComplete="given-name"
            placeholder="Jordan"
            maxLength={80}
            value={data.firstName}
            onChange={handleChange('firstName')}
          />
          <InputField
            label="Last name"
            name="family-name"
            autoComplete="family-name"
            placeholder="Lee"
            maxLength={80}
            value={data.lastName}
            onChange={handleChange('lastName')}
            hint="Add a name or organization to generate the card."
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Building2 aria-hidden="true" className="text-brand-600" size={20} />
          Work
        </legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputField
            label="Organization"
            name="organization"
            autoComplete="organization"
            placeholder="Acme Studio"
            maxLength={120}
            value={data.organization}
            onChange={handleChange('organization')}
          />
          <InputField
            label="Job title"
            name="organization-title"
            autoComplete="organization-title"
            placeholder="Creative Director"
            maxLength={120}
            value={data.title}
            onChange={handleChange('title')}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Phone aria-hidden="true" className="text-brand-600" size={20} />
          Contact details
        </legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputField
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="jordan@example.com"
            icon={<Mail size={14} />}
            maxLength={254}
            value={data.email}
            onChange={handleChange('email')}
            error={emailIsValid(data.email) ? undefined : 'Enter a valid email address.'}
          />
          <InputField
            label="Website"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="example.com"
            icon={<Globe size={14} />}
            maxLength={300}
            value={data.website}
            onChange={handleChange('website')}
            error={isValidWebUrl(data.website) ? undefined : 'Enter a valid http or https URL.'}
          />
          <InputField
            label="Mobile phone"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 555 010 2020"
            icon={<Phone size={14} />}
            maxLength={50}
            value={data.mobile}
            onChange={handleChange('mobile')}
          />
          <InputField
            label="Work phone"
            name="work-phone"
            type="tel"
            inputMode="tel"
            placeholder="+1 555 010 3030"
            icon={<Phone size={14} />}
            maxLength={50}
            value={data.phone}
            onChange={handleChange('phone')}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MapPin aria-hidden="true" className="text-brand-600" size={20} />
          Address
        </legend>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label="Street address"
              name="street-address"
              autoComplete="address-line1"
              placeholder="123 Main Street"
              maxLength={160}
              value={data.street}
              onChange={handleChange('street')}
            />
            <InputField
              label="Suite, unit, or building"
              name="address-line2"
              autoComplete="address-line2"
              placeholder="Suite 400"
              maxLength={120}
              value={data.addressLine2}
              onChange={handleChange('addressLine2')}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label="City"
              name="city"
              autoComplete="address-level2"
              placeholder="Austin"
              maxLength={100}
              value={data.city}
              onChange={handleChange('city')}
            />
            <InputField
              label="State or province"
              name="state"
              autoComplete="address-level1"
              placeholder="Texas"
              maxLength={100}
              value={data.state}
              onChange={handleChange('state')}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label="Postal code"
              name="postal-code"
              autoComplete="postal-code"
              placeholder="78701"
              maxLength={30}
              value={data.zip}
              onChange={handleChange('zip')}
            />
            <InputField
              label="Country"
              name="country-name"
              autoComplete="country-name"
              placeholder="United States"
              maxLength={100}
              value={data.country}
              onChange={handleChange('country')}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <FileText aria-hidden="true" className="text-brand-600" size={20} />
          Notes
        </legend>
        <TextAreaField
          label="Contact note"
          name="note"
          placeholder="Add context that should be saved with the contact."
          maxLength={500}
          showCount
          value={data.note}
          onChange={handleChange('note')}
          hint="Long notes create denser QR codes. Keep this concise for easier scanning."
        />
      </fieldset>
    </div>
  );
};

export default ContactForm;
