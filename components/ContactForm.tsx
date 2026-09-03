import React from 'react';
import { ContactData } from '../types';
import InputField from './InputField';
import { User, Building2, Phone, Mail, Globe, MapPin, FileText } from 'lucide-react';

interface ContactFormProps {
  data: ContactData;
  onChange: (field: keyof ContactData, value: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof ContactData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field, e.target.value);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Personal Info */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="text-brand-500" size={20} />
          Identity
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="First Name" 
            placeholder="Jane" 
            value={data.firstName}
            onChange={handleChange('firstName')}
          />
          <InputField 
            label="Last Name" 
            placeholder="Doe" 
            value={data.lastName}
            onChange={handleChange('lastName')}
          />
        </div>
      </section>

      {/* Professional */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="text-brand-500" size={20} />
          Professional
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="UTRGV Department/Division" 
            placeholder="e.g. Biology" 
            value={data.organization}
            onChange={handleChange('organization')}
          />
          <InputField 
            label="Job Title" 
            placeholder="Product Manager" 
            value={data.title}
            onChange={handleChange('title')}
          />
        </div>
      </section>

      {/* Contact */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Phone className="text-brand-500" size={20} />
          Contact Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Email" 
            type="email"
            placeholder="jane.doe@utrgv.edu" 
            icon={<Mail size={14} />}
            value={data.email}
            onChange={handleChange('email')}
          />
          <InputField 
            label="Departmental Website" 
            placeholder="https://utrgv.edu/biology" 
            icon={<Globe size={14} />}
            value={data.website}
            onChange={handleChange('website')}
          />
          <InputField 
            label="Mobile Phone" 
            type="tel"
            placeholder="+1 (956) 000-0000" 
            icon={<Phone size={14} />}
            value={data.mobile}
            onChange={handleChange('mobile')}
          />
          <InputField 
            label="Work Phone" 
            type="tel"
            placeholder="+1 (956) 000-0000" 
            icon={<Phone size={14} />}
            value={data.phone}
            onChange={handleChange('phone')}
          />
        </div>
      </section>

      {/* Address */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="text-brand-500" size={20} />
          Address
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Street" 
              placeholder="1201 West University Drive" 
              value={data.street}
              onChange={handleChange('street')}
            />
            <InputField 
              label="Office Building & Number" 
              placeholder="e.g. EABS 1.102" 
              value={data.officeLocation}
              onChange={handleChange('officeLocation')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="City" 
              placeholder="Edinburg" 
              value={data.city}
              onChange={handleChange('city')}
            />
            <InputField 
              label="State/Province" 
              placeholder="TX" 
              value={data.state}
              onChange={handleChange('state')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Zip/Postal Code" 
              placeholder="78539" 
              value={data.zip}
              onChange={handleChange('zip')}
            />
            <InputField 
              label="Country" 
              placeholder="USA" 
              value={data.country}
              onChange={handleChange('country')}
            />
          </div>
        </div>
      </section>

      {/* Note */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="text-brand-500" size={20} />
          Notes
        </h4>
        <div className="flex flex-col gap-1.5">
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400 min-h-[80px]"
            placeholder="Met at TechConf 2025..."
            value={data.note}
            onChange={handleChange('note')}
          />
        </div>
      </section>

    </div>
  );
};

export default ContactForm;