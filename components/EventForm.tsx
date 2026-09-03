import React from 'react';
import { EventData } from '../types';
import InputField from './InputField';
import { Calendar, MapPin, AlignLeft, Link, Clock, Globe } from 'lucide-react';

interface EventFormProps {
  data: EventData;
  onChange: (field: keyof EventData, value: string) => void;
}

const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const EventForm: React.FC<EventFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof EventData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(field, e.target.value);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Event Basics */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="text-brand-500" size={20} />
          Event Details
        </h4>
        <div className="space-y-4">
          <InputField 
            label="Event Title" 
            placeholder="e.g. UMC Annual Gala" 
            value={data.title}
            onChange={handleChange('title')}
          />
          <InputField 
            label="Location" 
            placeholder="e.g. Student Union Ballroom" 
            icon={<MapPin size={14} />}
            value={data.location}
            onChange={handleChange('location')}
          />
        </div>
      </section>

      {/* Timing */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="text-brand-500" size={20} />
          Date & Time
        </h4>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 group">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 transition-colors group-focus-within:text-brand-600">
              <span className="text-slate-400 group-focus-within:text-brand-500 transition-colors"><Globe size={14} /></span>
              Timezone
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm 
                           hover:border-brand-200 hover:shadow-md transition-all duration-300 ease-out
                           focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:shadow-lg
                           outline-none text-sm text-slate-800 appearance-none cursor-pointer"
                value={data.timezone}
                onChange={handleChange('timezone')}
              >
                {US_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Start Time" 
              type="datetime-local"
              value={data.startTime}
              onChange={handleChange('startTime')}
            />
            <InputField 
              label="End Time" 
              type="datetime-local"
              value={data.endTime}
              onChange={handleChange('endTime')}
            />
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section>
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlignLeft className="text-brand-500" size={20} />
          More Information
        </h4>
        <div className="space-y-4">
           <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400 min-h-[80px]"
              placeholder="Join us for an evening of..."
              value={data.description}
              onChange={handleChange('description')}
            />
          </div>
          <InputField 
            label="Event Link (URL)" 
            placeholder="https://utrgv.edu/event" 
            icon={<Link size={14} />}
            value={data.url}
            onChange={handleChange('url')}
          />
        </div>
      </section>

    </div>
  );
};

export default EventForm;