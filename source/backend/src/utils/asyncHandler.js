/**
 * Wrap async controller functions để tự động catch error
 * và forward cho Express error middleware thông qua next().
 *
 * Sử dụng:
 *   router.get('/users', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
