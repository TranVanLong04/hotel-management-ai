import { z } from 'zod';

export const sendMessageSchema = {
  body: z.object({
    message: z
      .string({ required_error: 'Tin nhắn không được để trống' })
      .min(1, 'Tin nhắn phải có ít nhất 1 ký tự')
      .max(1000, 'Tin nhắn không được vượt quá 1000 ký tự')
      .trim(),
    conversation_id: z
      .string()
      .uuid('conversation_id phải là UUID hợp lệ')
      .optional()
      .nullable(),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string(),
        })
      )
      .optional(),
  }),
};

export const conversationIdParamSchema = {
  params: z.object({
    id: z.string().uuid('ID hội thoại phải là UUID hợp lệ'),
  }),
};

export const paypalCaptureSchema = {
  body: z.object({
    orderId: z.string({ required_error: 'orderId không được để trống' }).min(1),
    bookingId: z.string().uuid('bookingId phải là UUID hợp lệ').optional(),
  }),
};

export const verifyFaceSchema = {
  body: z.object({
    booking_id: z.string({ required_error: 'booking_id không được để trống' }).uuid('booking_id phải là UUID hợp lệ'),
  }),
};


