/**
 * Types cho module Quản lý Dịch vụ (Phase 7 - Service Management)
 * Tham chiếu: docs/08-features/07-service-management.md
 */

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

export interface CreateServicePayload {
  name: string;
  description?: string | null;
  price: number;
  unit: string;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string | null;
  price?: number;
  unit?: string;
  is_active?: boolean;
}

export interface ServiceQueryParams {
  is_active?: boolean;
  search?: string;
}

