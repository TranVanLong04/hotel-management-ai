import type { ReactNode } from 'react';
import type { UserRole } from './index';

// ========== TABLE TYPES ==========

export type SortOrder = 'asc' | 'desc';

export interface SortState {
  column: string;
  order: SortOrder;
}

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => ReactNode;
}

// ========== DASHBOARD & REPORT TYPES ==========

export interface RoomStats {
  total: number;
  available: number;
  reserved: number;
  occupied: number;
  cleaning: number;
  maintenance: number;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  checked_in: number;
  checked_out: number;
  cancelled: number;
}

export interface DashboardStats {
  rooms: RoomStats;
  bookings_today: {
    total: number;
    pending: number;
    confirmed: number;
    checked_in: number;
    checked_out: number;
    cancelled: number;
  };
  revenue_today: number;
  revenue_this_month: number;
  new_customers_this_month: number;
  occupancy_rate: number;
}

export interface RevenuePoint {
  report_date: string;
  revenue: number;
  payment_count: number;
}

export interface RevenueReportResponse {
  period: {
    from: string;
    to: string;
    group_by: 'day' | 'week' | 'month';
  };
  total_revenue: number;
  data: RevenuePoint[];
}

export interface OccupancyPoint {
  report_date: string;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
}

export interface OccupancyReportResponse {
  period: {
    from: string;
    to: string;
  };
  average_occupancy: number;
  data: OccupancyPoint[];
}

export interface TopRoomType {
  room_type_id: string;
  name: string;
  revenue: number;
  booking_count: number;
  percentage?: number;
}

// ========== CRUD PAYLOADS ==========

export interface CreateRoomPayload {
  room_number: string;
  room_type_id: string;
  floor: number;
  description?: string;
}

export interface UpdateRoomPayload {
  room_number?: string;
  room_type_id?: string;
  floor?: number;
  description?: string;
}

export interface CreateRoomTypePayload {
  name: string;
  description?: string;
  max_guests: number;
  base_price: number;
  amenities?: string[];
  image_url?: string;
}

export interface UpdateRoomTypePayload {
  name?: string;
  description?: string;
  max_guests?: number;
  base_price?: number;
  amenities?: string[];
  image_url?: string;
}

export interface UpdateUserPayload {
  full_name?: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserStatusPayload {
  is_active: boolean;
}

export interface UserFilterParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  [key: string]: unknown;
}

export interface RevenueReportParams {
  from: string;
  to: string;
  group_by?: 'day' | 'week' | 'month';
}

export interface OccupancyReportParams {
  from: string;
  to: string;
}

