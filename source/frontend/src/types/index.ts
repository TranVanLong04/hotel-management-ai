// ========== UNION TYPES (thay cho enum — theo CLAUDE-RULES) ==========

/** Vai trò người dùng */
export type UserRole = 'admin' | 'staff' | 'customer';

/** Giới tính */
export type Gender = 'male' | 'female' | 'other';

/** Trạng thái phòng */
export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance';

/** Trạng thái đặt phòng — state machine: pending → confirmed → checked_in → checked_out */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

/** Trạng thái xác minh khuôn mặt */
export type FaceVerificationStatus = 'pending' | 'verified' | 'failed' | 'manual_review';

/** Trạng thái hóa đơn */
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

/** Phương thức thanh toán */
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'online' | 'other';

/** Trạng thái thanh toán */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ========== DATA MODELS (field names giữ snake_case từ DB) ==========

/** Người dùng — KHÔNG bao giờ trả password_hash về FE */
export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Khách hàng — user_id = null nếu khách vãng lai */
export interface Customer {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  identity_number: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

/** Hồ sơ khuôn mặt — face_embedding KHÔNG trả về FE */
export interface FaceProfile {
  id: string;
  customer_id: string;
  face_image_url: string;
  model_version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Loại phòng — base_price đơn vị VND */
export interface RoomType {
  id: string;
  name: string;
  description: string | null;
  max_guests: number;
  base_price: number;
  amenities: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Phòng — room_type chỉ có khi JOIN */
export interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number | null;
  status: RoomStatus;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  room_type?: RoomType;
}

/** Đặt phòng — room_price là snapshot giá tại thời điểm đặt */
export interface Booking {
  id: string;
  booking_code: string;
  customer_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_nights: number;
  number_of_guests: number;
  actual_check_in_at: string | null;
  actual_check_out_at: string | null;
  room_price: number;
  room_subtotal: number;
  status: BookingStatus;
  face_verification_status: FaceVerificationStatus;
  face_verified_at: string | null;
  face_match_score: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  room?: Room;
  rooms?: {
    id: string;
    room_number: string;
    floor: number | null;
    room_types?: {
      id: string;
      name: string;
      base_price?: number;
      max_guests?: number;
    };
  };
  customers?: {
    id: string;
    user_id?: string;
    full_name: string;
    phone: string;
    identity_number?: string | null;
  };
}

/** Dịch vụ khách sạn — price là giá hiện tại */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Sử dụng dịch vụ — unit_price là snapshot giá tại thời điểm dùng */
export interface ServiceUsage {
  id: string;
  booking_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  used_at: string;
  note: string | null;
  service?: Service;
}

/** Hóa đơn — booking_id là UNIQUE, mỗi booking chỉ 1 hóa đơn */
export interface Invoice {
  id: string;
  invoice_code: string;
  booking_id: string;
  customer_id: string;
  room_amount: number;
  service_amount: number;
  discount_rate: number | null;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  issued_at: string;
  created_at: string;
}

/** Thanh toán — refunded_amount trong khoảng [0, amount] */
export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  refunded_amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_code: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
}

// ========== API RESPONSE WRAPPERS ==========

/** Response thành công */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Response lỗi */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

/** Response phân trang */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== FILTER PARAMS ==========

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface BookingFilterParams extends PaginationParams {
  status?: BookingStatus;
  customer_id?: string;
  room_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface RoomFilterParams extends PaginationParams {
  status?: RoomStatus;
  room_type_id?: string;
  floor?: number;
  search?: string;
}

// ========== VIETNAMESE LABELS (cho hiển thị FE) ==========

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã nhận phòng',
  checked_out: 'Đã trả phòng',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'Trống',
  reserved: 'Đã đặt',
  occupied: 'Đang ở',
  cleaning: 'Đang dọn',
  maintenance: 'Bảo trì',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  credit_card: 'Thẻ tín dụng',
  online: 'Online',
  other: 'Khác',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  staff: 'Lễ tân',
  customer: 'Khách hàng',
};

// ========== COLOR MAPPINGS (dùng cho Badge component) ==========

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'warning',
  confirmed: 'info',
  checked_in: 'success',
  checked_out: 'default',
  cancelled: 'danger',
  no_show: 'warning',
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  available: 'success',
  reserved: 'info',
  occupied: 'danger',
  cleaning: 'warning',
  maintenance: 'default',
};

// ========== AUTH PAYLOADS & RESPONSES ==========

/** Payload gửi lên khi đăng nhập */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Payload gửi lên khi đăng ký */
export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

/** Dữ liệu trả về khi đăng nhập / đăng ký thành công */
export interface AuthResponse {
  user: User;
  token: string;
}

// ========== BOOKING PAYLOADS ==========

/** Payload tạo booking mới */
export interface CreateBookingPayload {
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  note?: string;
}

/** Payload hủy booking */
export interface CancelBookingPayload {
  reason?: string;
}

