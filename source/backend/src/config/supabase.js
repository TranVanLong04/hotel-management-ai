import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from './env.js';
import { logger } from './logger.js';

// Cấu hình chung cho Supabase clients
// Node.js 20 không có native WebSocket → cung cấp ws package
const commonOptions = {
  realtime: {
    transport: WebSocket,
  },
};

// Client admin — dùng SERVICE_ROLE_KEY, bypass RLS
// Chỉ dùng ở backend, KHÔNG expose ra frontend
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    ...commonOptions,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Client anon — dùng ANON_KEY, tuân thủ RLS
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  commonOptions
);

/**
 * Test kết nối Supabase bằng cách query bảng users limit 1.
 * Gọi khi server start để đảm bảo DB sẵn sàng.
 */
export const testConnection = async () => {
  const { error } = await supabaseAdmin
    .from('users')
    .select('id')
    .limit(1);

  if (error) {
    logger.error({ err: error }, '❌ Supabase connection failed');
    throw error;
  }

  logger.info('✅ Supabase connected successfully');
};
