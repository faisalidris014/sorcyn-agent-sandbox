import { z } from 'zod';

// ── Severity ───────────────────────────────────────────────

export const announcementSeverityEnum = z
  .enum(['info', 'warning', 'critical'])
  .describe('Banner severity — info (purple), warning (amber), critical (red)');

// ── Admin: Create ──────────────────────────────────────────

export const createAnnouncementSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(3)
      .max(500)
      .describe('Banner text shown to users (follow RUNBOOK_OPS.md §2 wording rules)'),
    severity: announcementSeverityEnum.default('info'),
    startsAt: z.coerce
      .date()
      .optional()
      .describe('When the banner becomes active. Defaults to now.'),
    endsAt: z.coerce
      .date()
      .nullish()
      .describe('When the banner expires. Null/omitted = open-ended.'),
  })
  .refine(
    (data) => !data.endsAt || !data.startsAt || data.endsAt > data.startsAt,
    { message: 'endsAt must be after startsAt', path: ['endsAt'] },
  );

// ── Admin: Delete ──────────────────────────────────────────

export const announcementIdParamsSchema = z.object({
  id: z.string().uuid('Invalid announcement ID').describe('Announcement UUID'),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
