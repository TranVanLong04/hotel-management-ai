import { supabaseAdmin } from '../../config/supabase.js';
import { InternalError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

/**
 * Repository tương tác bảng chat_conversations & chat_messages trên Supabase
 */

export const findConversationById = async (conversationId) => {
  const { data, error } = await supabaseAdmin
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error({ err: error }, 'Lỗi findConversationById');
    throw new InternalError('Không thể tìm thông tin phiên hội thoại');
  }
  return data;
};

export const createConversation = async ({ userId, role, title }) => {
  const { data, error } = await supabaseAdmin
    .from('chat_conversations')
    .insert({
      user_id: userId || null,
      role_context: role || 'customer',
      title: title || 'Hội thoại mới',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error({ err: error }, 'Lỗi createConversation');
    throw new InternalError('Không thể tạo phiên hội thoại mới');
  }
  return data;
};

export const getLatestActiveConversation = async (userId, role) => {
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('role_context', role)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, 'Lỗi getLatestActiveConversation');
    return null;
  }
  return data;
};

export const saveMessage = async ({
  conversationId,
  sender,
  content,
  uiType = 'text',
  uiPayload = null,
  promptTokens = 0,
  completionTokens = 0,
}) => {
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender,
      content,
      ui_type: uiType,
      ui_payload: uiPayload,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
    })
    .select()
    .single();

  if (error) {
    logger.error({ err: error }, 'Lỗi saveMessage');
    throw new InternalError('Không thể lưu tin nhắn hội thoại');
  }

  // Cập nhật updated_at cho conversation
  await supabaseAdmin
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
};

export const listMessagesByConversationId = async (conversationId, limit = 50) => {
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error({ err: error }, 'Lỗi listMessagesByConversationId');
    throw new InternalError('Không thể tải lịch sử tin nhắn');
  }
  return data || [];
};

