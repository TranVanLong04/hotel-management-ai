import { z } from 'zod';

export const runComparisonSchema = z.object({
  body: z.object({
    image1_url: z.string().url().optional(),
    image2_url: z.string().url().optional(),
    threshold_facenet: z.coerce.number().min(0).max(1).default(0.75),
    threshold_insightface: z.coerce.number().min(0).max(1).default(0.55),
    ground_truth: z.enum(['genuine', 'impostor', 'unknown']).default('unknown'),
    dataset_tag: z.string().max(50).default('manual'),
    reference_name: z.string().max(100).default('Khuôn mặt A'),
    test_name: z.string().max(100).default('Khuôn mặt B'),
  }),
});

export const getHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(15),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    dataset_tag: z.string().optional(),
    ground_truth: z.string().optional(),
    is_agreement: z.string().optional(),
  }),
});

export const getStatsSchema = z.object({
  query: z.object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    dataset_tag: z.string().optional(),
    threshold_facenet: z.coerce.number().min(0).max(1).optional(),
    threshold_insightface: z.coerce.number().min(0).max(1).optional(),
  }),
});

export const exportSchema = z.object({
  query: z.object({
    format: z.enum(['json', 'csv']).default('json'),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    dataset_tag: z.string().optional(),
  }),
});
