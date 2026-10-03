/**
 * Constants — Enum values cho toàn hệ thống.
 * Tham chiếu: docs/02-system-design/shared/04-enums.md
 */

// === User Roles ===
export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
});

// === Gender ===
export const GENDERS = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

// === Room Status ===
export const ROOM_STATUSES = Object.freeze({
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
});

// === Booking Status ===
export const BOOKING_STATUSES = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
});

// === Payment Gateways (Cổng thanh toán) ===
export const PAYMENT_GATEWAYS = Object.freeze({
  MOMO: 'momo',
  VNPAY: 'vnpay',
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  OTHER: 'other',
});

// === Face Verification Status ===
export const FACE_VERIFICATION_STATUSES = Object.freeze({
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
  MANUAL_REVIEW: 'manual_review',
});

// === Invoice Status ===
export const INVOICE_STATUSES = Object.freeze({
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
});

// === Payment Method ===
export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  ONLINE: 'online',
  OTHER: 'other',
});

// === Payment Status ===
export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

// === Pagination defaults ===
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});
