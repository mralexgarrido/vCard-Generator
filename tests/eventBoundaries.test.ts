import { describe, expect, it } from 'vitest';
import { createInitialEventData } from '../types';
import { applyEventPreset, getEventSummary } from '../utils/eventExperience';

describe('strict date boundaries', () => {
  it.each(['', ':00Z', '2026-02-31T10:00', '2026-09-09T25:00', 'nonsense'])('does not normalize invalid preset start %s into another date', (startTime) => {
    const original = { ...createInitialEventData(), startTime };
    expect(applyEventPreset(original, 'meeting')).toBe(original);
  });
  it('rejects a normalized impossible all-day date', () => {
    expect(getEventSummary({ ...createInitialEventData(), allDay: true, startTime: '2026-02-31', endTime: '2026-03-04' })).toBeNull();
  });
  it('preserves valid leap dates and crosses midnight', () => {
    const next = applyEventPreset({ ...createInitialEventData(), startTime: '2028-02-29T23:45' }, 'meeting');
    expect(next.endTime).toBe('2028-03-01T00:15');
  });
});
