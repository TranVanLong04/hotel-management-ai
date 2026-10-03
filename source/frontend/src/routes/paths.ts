/**
 * Tất cả route paths của ứng dụng
 * Tập trung 1 chỗ để dễ quản lý và tránh hardcode
 */
export const PATHS = {
  // === Public (không cần đăng nhập) ===
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ROOMS: '/rooms',
  ROOM_DETAIL: '/rooms/:id',

  // === Customer (yêu cầu đăng nhập) ===
  BOOKING: '/booking/:id',
  PAYMENT: '/payment/:bookingId',
  PAYMENT_MOMO_CALLBACK: '/payment/callback/momo',
  PAYMENT_VNPAY_CALLBACK: '/payment/callback/vnpay',
  MY_BOOKINGS: '/my-bookings',
  BOOKING_DETAIL: '/my-bookings/:id',
  MY_PROFILE: '/my-profile',
  FACE_REGISTER: '/face-register',

  // === Staff (role: staff hoặc admin) ===
  STAFF_CHECKIN: '/staff/checkin',
  STAFF_CHECKOUT: '/staff/checkout',
  STAFF_BOOKINGS: '/staff/bookings',

  // === Admin (role: admin) ===
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_ROOM_TYPES: '/admin/room-types',
  ADMIN_SERVICES: '/admin/services',
  ADMIN_USERS: '/admin/users',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_REPORTS: '/admin/reports',

  // === Error pages ===
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
