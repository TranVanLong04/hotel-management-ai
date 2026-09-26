import 'dotenv/config';
import { z } from 'zod';

// Schema validate env — fail fast nếu thiếu hoặc sai
const envSchema = z.object({
  // Supabase — bắt buộc
  SUPABASE_URL: z.string().url('SUPABASE_URL phải là URL hợp lệ'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY không được rỗng'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY không được rỗng'),

  // JWT — bắt buộc
  JWT_SECRET: z.string().min(32, 'JWT_SECRET phải có ít nhất 32 ký tự'),

  // Có default
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(10),

  // AI Service — tùy chọn
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_API_KEY: z.string().default(''),
});

// Parse và validate — nếu fail thì exit ngay
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Dùng console.error ở đây vì logger chưa khởi tạo
  console.error('❌ Env validation failed:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
