# Backend Architecture

## Layers
```
Request → Middlewares → Routes → Controller → Service → Repository → Supabase
```

## Trách nhiệm từng layer

### Controller
- Nhận HTTP request
- Extract data từ `req.body`, `req.query`, `req.params`
- Gọi service tương ứng
- Trả response theo format chuẩn
- **KHÔNG** chứa business logic
- **KHÔNG** query database trực tiếp
- Luôn wrap trong `asyncHandler`

### Service
- Chứa business logic
- Validate business rules
- Gọi repository để lấy/lưu data
- Gọi shared services khác nếu cần (AI, Storage)
- **KHÔNG** biết về HTTP (không có req, res)

### Repository
- Tương tác với Supabase
- Viết query
- Map data từ DB
- **KHÔNG** chứa business logic

## Request flow ví dụ: POST /api/bookings
```
1. app.js → cors → helmet → morgan
2. auth.middleware → verify JWT → req.user
3. validate.middleware → validate body
4. booking.routes → POST / → bookingController.create
5. bookingController.create:
   - Lấy req.body + req.user
   - Gọi bookingService.create(data, userId)
   - sendCreated(res, result)
6. bookingService.create:
   - Validate customer, room
   - Check guests ≤ max_guests
   - Snapshot room_price
   - Gọi bookingRepo.insert()
   - Log
   - Return booking
7. bookingRepo.insert:
   - supabaseAdmin.from('bookings').insert()
   - Handle PG error 23P01 (exclusion) → BOOKING_OVERLAP
   - Return record
8. Response format chuẩn
```

## Module pattern
Mỗi module (domain) có 5 file:
```
modules/auth/
├── auth.controller.js
├── auth.service.js
├── auth.repository.js
├── auth.routes.js
└── auth.validation.js
```

**Ví dụ routes:**
```javascript
const router = Router();
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
export default router;
```

## Supabase clients
- `supabaseAdmin` (service_role key) — dùng 99% trường hợp
- `supabase` (anon key) — chỉ khi cần RLS

## Config
- `env.js` — Validate env vars với Zod, fail fast nếu thiếu
- `supabase.js` — Export 2 clients
- `logger.js` — Pino, pretty cho dev, JSON cho production
- `constants.js` — Roles, statuses

## Error handling
- Throw `AppError` subclass (NotFoundError, ConflictError, ...)
- `asyncHandler` catch → `next(err)`
- `errorHandler` middleware format response
- Log level: `error` cho 5xx, `warn` cho 4xx

## Response helpers
- `sendSuccess(res, data, message)` — 200
- `sendCreated(res, data, message)` — 201
- `sendList(res, data, pagination, message)` — 200
- `sendNoContent(res)` — 204