import { z } from 'zod';

/**
 * Zod schemas cho module Reports.
 * Tham chiếu: docs/03-backend/phase9-reporting/README.md
 */

export const REPORT_GROUP_BY = Object.freeze({
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
});

const groupByValues = Object.values(REPORT_GROUP_BY);

// === Query — Dashboard ===
export const dashboardSchema = {
  query: z.object({
    period: z.string().trim().optional(),
  }),
};

// === Query — Báo cáo doanh thu ===
export const revenueReportSchema = {
  query: z
    .object({
      from: z
        .string({ required_error: 'from là bắt buộc' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'from phải có định dạng YYYY-MM-DD'),
      to: z
        .string({ required_error: 'to là bắt buộc' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'to phải có định dạng YYYY-MM-DD'),
      group_by: z.enum(groupByValues).default(REPORT_GROUP_BY.DAY),
    })
    .refine((data) => data.from <= data.to, {
      message: 'from không được lớn hơn to',
      path: ['from'],
    }),
};

// === Query — Báo cáo công suất phòng (Occupancy) ===
export const occupancyReportSchema = {
  query: z
    .object({
      from: z
        .string({ required_error: 'from là bắt buộc' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'from phải có định dạng YYYY-MM-DD'),
      to: z
        .string({ required_error: 'to là bắt buộc' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'to phải có định dạng YYYY-MM-DD'),
    })
    .refine((data) => data.from <= data.to, {
      message: 'from không được lớn hơn to',
      path: ['from'],
    }),
};
