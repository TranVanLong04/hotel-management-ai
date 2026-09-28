import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import * as invoicesService from './invoices.service.js';

/**
 * Controller — HTTP handlers cho module Invoices.
 * Tham chiếu: docs/03-backend/phase8-service-invoice/README.md
 */

/**
 * GET /api/invoices
 * Danh sách hóa đơn (Customer chỉ xem của mình, Staff/Admin xem tất cả).
 */
export const listInvoices = asyncHandler(async (req, res) => {
  const result = await invoicesService.listInvoices(req.query, req.user);
  sendList(res, result.data, result.pagination);
});

/**
 * GET /api/invoices/:id
 * Chi tiết hóa đơn (Customer chỉ xem hóa đơn của mình, Staff/Admin xem tất cả).
 */
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoicesService.getInvoice(req.params.id, req.user);
  sendSuccess(res, invoice);
});

/**
 * POST /api/invoices/:id/payments
 * Staff ghi nhận thanh toán bổ sung cho hóa đơn.
 */
export const addPayment = asyncHandler(async (req, res) => {
  const result = await invoicesService.addPayment(
    req.params.id,
    req.body,
    req.user.sub
  );

  sendSuccess(res, result, 'Thanh toán bổ sung thành công');
});
