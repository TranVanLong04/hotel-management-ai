import api from './axios';
import type { ApiResponse, CustomerProfile, UpdateCustomerProfileDto } from '@/types';

/**
 * Service API cho Customer Profile
 * Tham chiếu: docs/08-features/02-customer-profile.md
 */

/**
 * Lấy thông tin hồ sơ của khách hàng hiện tại
 * @returns Thông tin CustomerProfile
 */
export const getMyProfileApi = async (): Promise<CustomerProfile> => {
  const res = (await api.get('/customers/me')) as unknown as ApiResponse<CustomerProfile>;
  return res.data;
};

/**
 * Cập nhật thông tin hồ sơ của khách hàng hiện tại
 * @param data Dữ liệu cập nhật
 * @returns Thông tin CustomerProfile sau khi cập nhật
 */
export const updateMyProfileApi = async (
  data: UpdateCustomerProfileDto
): Promise<CustomerProfile> => {
  const res = (await api.patch('/customers/me', data)) as unknown as ApiResponse<CustomerProfile>;
  return res.data;
};
