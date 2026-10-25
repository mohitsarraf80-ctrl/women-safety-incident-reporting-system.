import { describe, expect, it } from 'vitest';
import { reportSchema } from './reportSchema';

const base = {
  type: 'STALKING' as const,
  description: 'A person followed me from the metro station towards the market and would not leave.',
  occurredAt: '2026-10-24T22:30',
  zoneName: 'Sector 62 Metro Station',
  latitude: '',
  longitude: '',
  anonymous: true,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  requiresImmediateAssistance: false,
};

function firstError(values: Record<string, unknown>): string | undefined {
  const result = reportSchema.safeParse({ ...base, ...values });
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('reportSchema', () => {
  it('accepts a complete anonymous report', () => {
    expect(reportSchema.safeParse(base).success).toBe(true);
  });

  it('rejects descriptions shorter than 20 characters', () => {
    expect(firstError({ description: 'too short' })).toMatch(/at least 20 characters/);
  });

  it('rejects a future incident time', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    expect(firstError({ occurredAt: future })).toMatch(/cannot be in the future/);
  });

  it('requires latitude and longitude together', () => {
    expect(firstError({ latitude: '28.62', longitude: '' })).toMatch(/both latitude and longitude/);
  });

  it('rejects out-of-range coordinates', () => {
    expect(firstError({ latitude: '120', longitude: '77.37' })).toMatch(/Latitude must be between/);
    expect(firstError({ latitude: '28.62', longitude: '400' })).toMatch(/Longitude must be between/);
  });

  it('accepts coordinates without a zone', () => {
    const result = reportSchema.safeParse({ ...base, zoneName: '', latitude: '28.6205', longitude: '77.3700' });
    expect(result.success).toBe(true);
  });

  it('requires a zone when coordinates are absent', () => {
    expect(firstError({ zoneName: '' })).toMatch(/Add a zone or landmark/);
  });

  it('validates an optional contact email', () => {
    expect(firstError({ contactEmail: 'not-an-email' })).toMatch(/valid email/);
    expect(reportSchema.safeParse({ ...base, contactEmail: 'person@example.com' }).success).toBe(true);
  });
});
