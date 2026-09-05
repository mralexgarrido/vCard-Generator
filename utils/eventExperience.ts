import { EventData } from '../types';
import { zonedDateTimeToUtc } from './calendarHelper';

export const EVENT_PRESETS = [
  { id: 'meeting', label: 'Quick meeting', detail: '30 min · 5 min reminder', minutes: 30, reminder: 5 },
  { id: 'workshop', label: 'Workshop', detail: '2 hours · 30 min reminder', minutes: 120, reminder: 30 },
  { id: 'celebration', label: 'Celebration', detail: '3 hours · 1 day reminder', minutes: 180, reminder: 1440 },
] as const;

/** Presets change scheduling preferences, never overwrite an entered identity, location, or description. */
export function applyEventPreset(data: EventData, id: string): EventData {
  const preset = EVENT_PRESETS.find((item) => item.id === id);
  if (!preset) return data;
  const start = data.startTime.length === 10 ? `${data.startTime}T09:00` : data.startTime;
  const timestamp = Date.parse(`${start}:00Z`);
  if (!Number.isFinite(timestamp)) return data;
  return { ...data, allDay: false, startTime: start, endTime: new Date(timestamp + preset.minutes * 60000).toISOString().slice(0, 16), reminderMinutes: preset.reminder };
}

export function getEventSummary(data: EventData, now = Date.now()) {
  try {
    const startDate = new Date(`${data.startTime.slice(0, 10)}T12:00:00Z`);
    const endDate = new Date(`${data.endTime.slice(0, 10)}T12:00:00Z`);
    const formatDate = (date: Date) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
    const dates = data.startTime.slice(0, 10) === data.endTime.slice(0, 10) ? formatDate(startDate) : `${formatDate(startDate)} to ${formatDate(endDate)}`;
    if (data.allDay) {
      const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
      if (days < 1 || !Number.isFinite(days)) return null;
      return { date: dates, time: 'All day', duration: `${days} ${days === 1 ? 'day' : 'days'}`, countdown: '' };
    }
    const start = zonedDateTimeToUtc(data.startTime, data.timezone);
    const end = zonedDateTimeToUtc(data.endTime, data.timezone);
    const startMs = start.getTime();
    const endMs = end.getTime();
    if (endMs <= startMs) return null;
    const minutes = Math.round((endMs - startMs) / 60000);
    const duration = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
    const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: data.timezone });
    const difference = startMs - now;
    const countdown = now >= endMs ? 'Event has ended' : now >= startMs ? 'Happening now' : difference < 60000 ? 'Starts in less than a minute' : difference < 3600000 ? `Starts in ${Math.ceil(difference / 60000)} min` : difference < 86400000 ? `Starts in about ${Math.ceil(difference / 3600000)} hr` : `Starts in about ${Math.ceil(difference / 86400000)} days`;
    return { date: dates, time: `${timeFormat.format(start)} to ${timeFormat.format(end)} · ${data.timezone}`, duration, countdown };
  } catch { return null; }
}
