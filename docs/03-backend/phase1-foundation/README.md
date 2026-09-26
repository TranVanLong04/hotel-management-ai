# Phase 1: Foundation

## Mục tiêu
Setup hạ tầng backend cơ bản trước khi code nghiệp vụ.

## Files cần tạo

```
src/config/
├── env.js           ← Validate env với Zod
├── supabase.js      ← 2 clients (admin + anon)
├── logger.js        ← Pino
└── constants.js     ← Roles, statuses

src/middlewares/
├── error.middleware.js
├── notFound.middleware.js
└── validate.middleware.js

src/utils/
├── errors.js        ← AppError + subclasses
├── response.js      ← sendSuccess, sendCreated, sendList
└── asyncHandler.js

src/app.js
src/server.js
```

## Chi tiết từng file

### `config/env.js`
- Dùng Zod validate `process.env`
- Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET (min 32 chars)
- Defaults: NODE_ENV=development, PORT=3000, JWT_EXPIRES_IN=7d, BCRYPT_ROUNDS=10, AI_SERVICE_URL, AI_SERVICE_API_KEY
- Nếu parse fail → `console.error` + `process.exit(1)`
- Export `env` object

### `config/supabase.js`
- Export `supabaseAdmin` (dùng SERVICE_ROLE_KEY, auth persist false)
- Export `supabase` (dùng ANON_KEY)
- Export `testConnection()` — query bảng users limit 1 để test

### `config/logger.js`
- Dùng pino
- Dev: `pino-pretty` (colorize, translateTime)
- Prod: JSON logs
- Redact: password, password_hash, token, authorization, req.headers.authorization
- Export `logger`

### `utils/errors.js`
- Base class `AppError(code, message, statusCode = 400, details = null)` với `isOperational = true`
- Subclasses: `BadRequestError` (400), `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError(resource)` (404), `ConflictError(code, message)` (409), `InternalError` (500), `ServiceUnavailableError` (503)

### `utils/asyncHandler.js`
- Export function wrap async controller, catch error → `next(err)`

### `utils/response.js`
- `sendSuccess(res, data, message = 'Thành công', statusCode = 200)`
- `sendCreated(res, data, message = 'Tạo mới thành công')` → 201
- `sendList(res, data, pagination, message)` → 200 với pagination
- `sendNoContent(res)` → 204

### `middlewares/error.middleware.js`
- Log với level: `error` cho 5xx, `warn` cho 4xx
- Nếu `err instanceof AppError && isOperational` → return JSON `{ success: false, error: { code, message, details? } }`
- Nếu không → 500 với message generic, ẩn stack (chỉ show ở dev)

### `middlewares/notFound.middleware.js`
- Gọi `next(new NotFoundError('Route'))`

### `middlewares/validate.middleware.js`
- Nhận Zod schema với `{ body, query, params }`
- Nếu fail → `next(new ValidationError('Dữ liệu không hợp lệ', details))`
- Details format: `[{ field: 'body.email', message: 'Email không hợp lệ' }]`
- Nếu pass → replace `req.body/query/params` với data đã validate

### `app.js`
- Init Express
- Middlewares: helmet → cors (whitelist localhost:5173) → express.json (limit 10mb) → morgan (stream qua logger)
- Route `/health` → return `{ status: 'ok', uptime, timestamp, env }`
- Placeholder cho mount routes sau
- Cuối cùng: `notFoundHandler` + `errorHandler`

### `server.js`
- Import app + env + logger
- `app.listen(PORT, '0.0.0.0')`
- Test Supabase connection khi start → log ✅ hoặc exit
- Graceful shutdown: SIGTERM/SIGINT → close server, exit sau 10s nếu không close
- Handle `unhandledRejection` + `uncaughtException`

## Test
- GET /health → 200
- GET /unknown → 404 với code `ROUTE_NOT_FOUND`
- Env thiếu → process exit với message rõ

## Điều kiện hoàn thành
- [ ] `pnpm dev` chạy OK
- [ ] Health check hoạt động
- [ ] Supabase connection test pass
- [ ] Logger hoạt động (không dùng console.log)
- [ ] Error middleware format đúng
- [ ] Graceful shutdown OK

## Reference
- Architecture: `docs/02-system-design/backend/01-architecture.md`
- Error handling: `docs/02-system-design/backend/04-error-handling.md`

## Git workflow
```bash
git checkout develop
git checkout -b feature/backend-phase1-foundation
git add .
git commit -m "checkpoint: before phase1"

# Prompt AI:
# "Đọc CLAUDE.md, docs/00-CLAUDE-RULES.md,
#  và docs/03-backend/phase1-foundation/README.md.
#  Implement phase 1."

git diff
git commit -m "feat(backend): implement phase1 foundation"
```