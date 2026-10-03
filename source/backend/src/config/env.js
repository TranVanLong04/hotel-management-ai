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

  // Frontend URL
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // MoMo Gateway
  MOMO_PARTNER_CODE: z.string().default('MOMO'),
  MOMO_ACCESS_KEY: z.string().default('F8BBA842ECF85'),
  MOMO_SECRET_KEY: z.string().default('K951B6PE1waDMi640xX08PD3vg6EkVlz'),
  MOMO_API_URL: z.string().url().default('https://test-payment.momo.vn/v2/gateway/api/create'),
  MOMO_QUERY_URL: z.string().url().default('https://test-payment.momo.vn/v2/gateway/api/query'),
  MOMO_REDIRECT_URL: z.string().default('http://localhost:5173/payment/callback/momo'),
  MOMO_IPN_URL: z.string().default('https://hotel-ai-webhook.ngrok.io/api/payments/momo/ipn'),

  // VNPay Gateway
  VNPAY_TMN_CODE: z.string().default('TESTTMN1'),
  VNPAY_HASH_SECRET: z.string().default('TESTHASHSECRET1234567890ABCDEF'),
  VNPAY_URL: z.string().url().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  VNPAY_RETURN_URL: z.string().default('http://localhost:5173/payment/callback/vnpay'),
  VNPAY_API_URL: z.string().url().default('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'),

  // Email SMTP
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('Hotel AI <no-reply@hotel-ai.com>'),
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
