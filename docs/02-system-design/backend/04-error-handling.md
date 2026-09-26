# Error Handling

## Nguyên tắc
1. Fail fast — validate sớm
2. Không leak internal info (stack trace)
3. Log đầy đủ ở server
4. Format response nhất quán

## Custom Error classes — `utils/errors.js`

**Base:** `AppError(code, message, statusCode, details)`
- `isOperational = true` (đánh dấu lỗi nghiệp vụ)

**Subclasses:**
- `BadRequestError` (400)
- `ValidationError` (400) — có `details` array
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError(resource)` (404) — code = `<RESOURCE>_NOT_FOUND`
- `ConflictError(code, message)` (409)
- `InternalError` (500)
- `ServiceUnavailableError` (503)

## Error middleware — `middlewares/error.middleware.js`

Logic:
1. Log với level phù hợp (error cho 5xx, warn cho 4xx)
2. Nếu `err instanceof AppError && err.isOperational` → return JSON với code/message/details
3. Nếu không → return generic 500, ẩn stack (chỉ show ở dev)

## Async handler — `utils/asyncHandler.js`

```javascript
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**Luôn dùng** cho mọi controller để catch async errors.

## Validation middleware

- Input: Zod schema với `{ body, query, params }`
- Nếu fail → `next(new ValidationError('Dữ liệu không hợp lệ', details))`
- Details format: `[{ field: 'body.email', message: '...' }]`
- Nếu pass → replace req.body/query/params với data đã validate (strip unknown fields)

## Throw lỗi trong service

```javascript
// ✅ Đúng
throw new NotFoundError('Booking');
throw new ConflictError('BOOKING_OVERLAP', 'Phòng đã được đặt');
throw new UnauthorizedError('Email hoặc mật khẩu không đúng');

// ❌ Sai
throw new Error('Not found');
res.status(404).json(...)  // Không làm trong service
```

## Response helpers — `utils/response.js`

- `sendSuccess(res, data, message = 'Thành công', statusCode = 200)`
- `sendCreated(res, data, message = 'Tạo mới thành công')`
- `sendList(res, data, pagination, message)`
- `sendNoContent(res)` — 204

## Error flow
```
Controller throw AppError
   ↓
asyncHandler catch → next(err)
   ↓
errorHandler middleware
   ↓
Log (warn 4xx, error 5xx)
   ↓
Check instanceof AppError?
   ├── Yes → { success: false, error: { code, message, details } }
   └── No  → { success: false, error: { code: 'INTERNAL_ERROR', message: '...' } }
```