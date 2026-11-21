import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { uploadChatFace } from '../../middlewares/upload.middleware.js';
import {
  sendMessageSchema,
  conversationIdParamSchema,
  paypalCaptureSchema,
  verifyFaceSchema,
} from './chat.validation.js';
import * as chatController from './chat.controller.js';

const router = Router();

/**
 * Routes cho Chatbot Gateway:
 * - POST /api/chat/message                    -> Gửi câu hỏi và nhận câu trả lời AI
 * - GET  /api/chat/conversations/:id/messages -> Lấy toàn bộ tin nhắn của hội thoại
 * - POST /api/chat/paypal/capture             -> Xác nhận thanh toán PayPal từ Chatbot
 * - POST /api/chat/verify-face                -> Xác thực khuôn mặt AI check-in từ Chatbot
 */

// Gửi tin nhắn đến AI Chatbot (yêu cầu authenticate)
router.post(
  '/message',
  authenticate,
  validate(sendMessageSchema),
  chatController.sendMessage
);

// Lấy lịch sử tin nhắn
router.get(
  '/conversations/:id/messages',
  authenticate,
  validate(conversationIdParamSchema),
  chatController.getConversationMessages
);

// Capture PayPal payment qua chatbot
router.post(
  '/paypal/capture',
  authenticate,
  validate(paypalCaptureSchema),
  chatController.capturePaypalPayment
);

// Quét & xác thực khuôn mặt check-in qua chatbot
router.post(
  '/verify-face',
  authenticate,
  uploadChatFace,
  validate(verifyFaceSchema),
  chatController.verifyFace
);

export default router;


