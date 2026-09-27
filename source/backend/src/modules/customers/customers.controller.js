import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import * as customersService from './customers.service.js';

/**
 * Controller — HTTP handlers cho module Customers.
 * Tham chiếu: docs/03-backend/phase3-user-management/README.md
 */

/**
 * GET /api/customers/me
 * Customer tự xem profile của mình.
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const customer = await customersService.getMyProfile(req.user.sub);

  sendSuccess(res, customer);
});

/**
 * PATCH /api/customers/me
 * Customer tự cập nhật profile.
 * Body: { full_name?, phone?, identity_number?, date_of_birth?, gender?, address? }
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const updatedCustomer = await customersService.updateMyProfile(
    req.user.sub,
    req.body
  );

  sendSuccess(res, updatedCustomer, 'Cập nhật hồ sơ thành công');
});

/**
 * GET /api/customers
 * Staff/Admin xem danh sách customers.
 */
export const listCustomers = asyncHandler(async (req, res) => {
  const { data, pagination } = await customersService.listCustomers(req.query);

  sendList(res, data, pagination);
});

/**
 * GET /api/customers/:id
 * Staff/Admin xem chi tiết customer (có bookings gần đây).
 */
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customersService.getCustomerById(req.params.id);

  sendSuccess(res, customer);
});
