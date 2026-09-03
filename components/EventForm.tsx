import { ChangeEvent, useMemo } from 'react';
import { AlignLeft, Bell, Calendar, Clock, Globe, Link, MapPin, TimerReset } from 'lucide-react';
import { EventData } from '../types';
import { getSupportedTimezones } from '../utils/timezones';
import { isValidWebUrl } from '../utils/url';
import InputField from './InputField';
import TextAreaField from './TextAreaField';

interface EventFormProps {
  data: EventData;
  onChange: <K extends keyof EventData>(field: K, value: EventData[K]) => void;
}

const toDateOnly = (value: string) => value.slice(0, 10);

const toDateTime = (value: string, fallbackTime: string) => {
  if (!value) return '';
  return value.includes('T') ? value : `${value}T${fallbackTime}`;
};

const parseNeutralDateTime = (value: string) => {
  const timestamp = Date.parse(`${value}:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const addMinutes = (value: string, minutes: number) => {
  const timestamp = parseNeutralDateTime(value);
  if (timestamp === null) return '';
  return new Date(timestamp + minutes * 60_000).toISOString().slice(0, 16);
};

const getDurationMinutes = (start: string, end: string) => {
  const startTimestamp = parseNeutralDateTime(start);
  const endTimestamp = parseNeutralDateTime(end);
  if (startTimestamp === null || endTimestamp === null || endTimestamp <= startTimestamp) return 60;
  return Math.round((endTimestamp - startTimestamp) / 60_000);
};

const durationOptions = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
];

const reminderOptions = [
  { label: 'No reminder', value: '' },
  { label: 'At start time', value: '0' },
  { label: '5 minutes before', value: '5' },
  { label: '15 minutes before', value: '15' },
  { label: '30 minutes before', value: '30' },
  { label: '1 hour before', value: '60' },
  { label: '1 day before', value: '1440' },
];

const EventForm = ({ data, onChange }: EventFormProps) => {
  const timezones = useMemo(getSupportedTimezones, []);

  const handleTextChange = (
    field: Exclude<keyof EventData, 'allDay' | 'reminderMinutes'>,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field, event.target.value);
  };

  const handleStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextStart = event.target.value;
    const duration = getDurationMinutes(data.startTime, data.endTime);
    onChange('startTime', nextStart);
    onChange('endTime', addMinutes(nextStart, duration));
  };

  const setDuration = (minutes: number) => {
    const nextEnd = addMinutes(data.startTime, minutes);
    if (nextEnd) onChange('endTime', nextEnd);
  };

  const handleAllDayChange = (event: ChangeEvent<HTMLInputElement>) => {
    const allDay = event.target.checked;
    onChange('allDay', allDay);

    if (allDay) {
      onChange('startTime', toDateOnly(data.startTime));
      onChange('endTime', toDateOnly(data.endTime));
    } else {
      onChange('startTime', toDateTime(data.startTime, '09:00'));
      onChange('endTime', toDateTime(data.endTime, '10:00'));
    }
  };

  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Calendar aria-hidden="true" className="text-brand-600" size={20} />
          Event details
        </legend>
        <div className="space-y-5">
          <InputField
            label="Event title"
            name="event-title"
            placeholder="Community open house"
            required
            maxLength={160}
            value={data.title}
            onChange={handleTextChange('title')}
          />
          <InputField
            label="Location"
            name="event-location"
            placeholder="Conference Center or online"
            icon={<MapPin size={14} />}
            maxLength={220}
            value={data.location}
            onChange={handleTextChange('location')}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Clock aria-hidden="true" className="text-brand-600" size={20} />
          Date and time
        </legend>

        <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-300">
          <input
            type="checkbox"
            checked={data.allDay}
            onChange={handleAllDayChange}
            className="mt-0.5 h-5 w-5 accent-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">All-day event</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
              Use this for holidays, conferences, deadlines, and events without a specific time.
            </span>
          </span>
        </label>

        <div className="space-y-5">
          {!data.allDay && (
            <div>
              <InputField
                label="Time zone"
                name="timezone"
                list="timezone-options"
                autoComplete="off"
                icon={<Globe size={14} />}
                required
                value={data.timezone}
                onChange={handleTextChange('timezone')}
                hint="Start and end times are converted to UTC for reliable calendar imports."
              />
              <datalist id="timezone-options">
                {timezones.map((timezone) => <option key={timezone} value={timezone} />)}
              </datalist>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label={data.allDay ? 'Start date' : 'Start date and time'}
              name="event-start"
              type={data.allDay ? 'date' : 'datetime-local'}
              required
              value={data.startTime}
              onChange={data.allDay ? handleTextChange('startTime') : handleStartChange}
            />
            <InputField
              label={data.allDay ? 'End date' : 'End date and time'}
              name="event-end"
              type={data.allDay ? 'date' : 'datetime-local'}
              required
              min={data.startTime || undefined}
              value={data.endTime}
              onChange={handleTextChange('endTime')}
              hint={data.allDay ? 'The end date is inclusive.' : undefined}
            />
          </div>

          {!data.allDay && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <TimerReset aria-hidden="true" size={14} className="text-slate-400" />
                Quick duration
              </p>
              <div className="flex flex-wrap gap-2" aria-label="Set event duration">
                {durationOptions.map((option) => {
                  const selected = getDurationMinutes(data.startTime, data.endTime) === option.minutes;
                  return (
                    <button
                      key={option.minutes}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setDuration(option.minutes)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${selected ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-800'}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="group flex flex-col gap-2">
            <label htmlFor="event-reminder" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors group-focus-within:text-brand-700">
              <Bell aria-hidden="true" size={14} className="text-slate-400 transition-colors group-focus-within:text-brand-600" />
              Calendar reminder
            </label>
            <select
              id="event-reminder"
              value={data.reminderMinutes ?? ''}
              onChange={(event) => onChange('reminderMinutes', event.target.value === '' ? null : Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition hover:border-brand-300 focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/15"
            >
              {reminderOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
            </select>
            <p className="text-xs leading-relaxed text-slate-500">Included inside the downloaded ICS file and event QR code.</p>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <AlignLeft aria-hidden="true" className="text-brand-600" size={20} />
          More information
        </legend>
        <div className="space-y-5">
          <TextAreaField
            label="Description"
            name="event-description"
            placeholder="Add the details attendees should see in their calendar."
            maxLength={750}
            showCount
            value={data.description}
            onChange={handleTextChange('description')}
            hint="Keep descriptions focused so the QR code remains easy to scan."
          />
          <InputField
            label="Event link"
            name="event-url"
            type="text"
            inputMode="url"
            placeholder="example.com/register"
            icon={<Link size={14} />}
            maxLength={300}
            value={data.url}
            onChange={handleTextChange('url')}
            error={isValidWebUrl(data.url) ? undefined : 'Enter a valid http or https URL.'}
          />
        </div>
      </fieldset>
    </div>
  );
};

export default EventForm;
