/**
 * Response helpers — đảm bảo format nhất quán.
 * Tham chiếu: docs/02-system-design/backend/04-error-handling.md
 *
 * Mọi response thành công đều có format:
 *   { success: true, data: ..., message: '...' }
 */

/**
 * Trả về response thành công (200 OK)
 */
export const sendSuccess = (res, data, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

/**
 * Trả về response tạo mới thành công (201 Created)
 */
export const sendCreated = (res, data, message = 'Tạo mới thành công') => {
  return res.status(201).json({
    success: true,
    data,
    message,
  });
};

/**
 * Trả về danh sách có phân trang
 * pagination = { page, limit, total, totalPages }
 */
export const sendList = (res, data, pagination, message = 'Thành công') => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
    message,
  });
};

/**
 * Trả về 204 No Content (dùng cho delete, v.v.)
 */
export const sendNoContent = (res) => {
  return res.status(204).end();
};
