import { z } from 'zod';

const CONTACT_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Client-side validation for the incident form. The Java backend re-validates every rule;
 * this schema exists to give immediate, field-level feedback in the browser.
 */
export const reportSchema = z
  .object({
    type: z.enum([
      'VERBAL_HARASSMENT',
      'CYBER_HARASSMENT',
      'STALKING',
      'ASSAULT',
      'SEXUAL_ASSAULT',
      'OTHER',
    ]),
    description: z
      .string()
      .min(20, 'Please describe what happened in at least 20 characters')
      .max(4000, 'Keep the description under 4000 characters'),
    occurredAt: z.string().min(1, 'Choose the date and time of the incident'),
    zoneName: z.string().max(160).optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    anonymous: z.boolean(),
    contactName: z.string().max(120).optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    requiresImmediateAssistance: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const occurred = new Date(values.occurredAt);
    if (Number.isNaN(occurred.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['occurredAt'], message: 'Enter a valid date and time' });
    } else if (occurred.getTime() > Date.now() + 60_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['occurredAt'],
        message: 'The incident time cannot be in the future',
      });
    }

    const hasLat = Boolean(values.latitude && values.latitude.trim() !== '');
    const hasLng = Boolean(values.longitude && values.longitude.trim() !== '');
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['latitude'],
        message: 'Provide both latitude and longitude, or neither',
      });
    }
    if (hasLat) {
      const lat = Number(values.latitude);
      const lng = Number(values.longitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['latitude'], message: 'Latitude must be between -90 and 90' });
      }
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['longitude'], message: 'Longitude must be between -180 and 180' });
      }
    }

    if (!hasLat && (!values.zoneName || values.zoneName.trim().length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['zoneName'],
        message: 'Add a zone or landmark, or share your coordinates',
      });
    }

    if (values.contactEmail && !CONTACT_EMAIL.test(values.contactEmail)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contactEmail'], message: 'Enter a valid email address' });
    }
  });

export type ReportFormValues = z.infer<typeof reportSchema>;
