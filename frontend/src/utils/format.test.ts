import { describe, expect, it } from 'vitest';
import { formatBytes, formatDateTime, formatHours, pluralise, relativeTime } from './format';

describe('format helpers', () => {
  it('formats an instant in the Asia/Kolkata display zone', () => {
    const formatted = formatDateTime('2026-10-25T11:13:01Z');
    expect(formatted).toContain('25 Oct 2026');
    expect(formatted).toContain('04:43');
    expect(formatted).toContain('IST');
  });

  it('returns an em dash for missing or invalid values', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });

  it('formats durations above and below a day', () => {
    expect(formatHours(0)).toBe('0 h');
    expect(formatHours(5.5)).toBe('5.5 h');
    expect(formatHours(30)).toBe('1 d 6 h');
  });

  it('pluralises counts correctly', () => {
    expect(pluralise(1, 'report')).toBe('1 report');
    expect(pluralise(3, 'report')).toBe('3 reports');
    expect(pluralise(2, 'match', 'matches')).toBe('2 matches');
  });

  it('formats file sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('describes recent timestamps relatively', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(relativeTime(twoMinutesAgo)).toBe('2 min ago');
  });
});
