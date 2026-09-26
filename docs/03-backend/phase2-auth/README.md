# Phase 2: Authentication

## Mục tiêu
Đăng ký, đăng nhập, JWT, middlewares auth + role.

## Files cần tạo

```
src/modules/auth/
├── auth.validation.js   ← Zod schemas
├── auth.repository.js   ← DB queries
├── auth.service.js      ← Business logic
├── auth.controller.js   ← HTTP handlers
└── auth.routes.js

src/middlewares/
├── auth.middleware.js
└── role.middleware.js
```

## Chi tiết

### `auth.validation.js`
Export 4 Zod schemas:
- `registerSchema`: body với email (email valid), password (min 8, có chữ hoa, có số), full_name (2-100), phone (regex 10-11 số)
- `loginSchema`: email + password (min 1)
- `userIdSchema`: params.id là UUID
- `updateProfileSchema`: full_name, phone, date_of_birth, gender (enum), address — optional

Wrap trong `z.object({ body: z.object({...}) })`.

### `auth.repository.js`
Export 4 functions (dùng `supabaseAdmin`):

- `findByEmail(email)` — query `users`, `.eq('email', email).maybeSingle()`, return user hoặc null
- `findById(id)` — query `users`, select fields TRỪ `password_hash`, `.maybeSingle()`
- `createUser(data)` — insert vào `users`, select record (trừ password_hash). Handle PG error `23505` → throw `ConflictError('AUTH_EMAIL_EXISTS')`
- `createCustomer(data)` — insert vào `customers`

### `auth.service.js`

**Helper `generateToken(user)`** — JWT sign với payload `{ sub: user.id, email, role }`, expiry từ env.

**`register({ email, password, full_name, phone })`:**
1. `findByEmail` → nếu có → throw `ConflictError('AUTH_EMAIL_EXISTS', 'Email đã được sử dụng')`
2. Hash password với bcrypt(BCRYPT_ROUNDS)
3. Tạo username: `email.split('@')[0] + '_' + Date.now()`
4. `createUser` với `role: 'customer'`, lưu password_hash
5. `createCustomer` với `user_id` vừa tạo
6. Generate token
7. Log `{ userId }` khi thành công
8. Return `{ user: {id, email, full_name, phone, role}, token }` — KHÔNG có password_hash

**`login(email, password)`:**
1. `findByEmail` → nếu null → throw `UnauthorizedError('Email hoặc mật khẩu không đúng')`
2. `bcrypt.compare` → nếu sai → throw **CÙNG message trên** (không tiết lộ email tồn tại)
3. Check `is_active` → nếu false → throw `ForbiddenError('Tài khoản đã bị khóa')`
4. Generate token
5. Log khi thành công
6. Return `{ user, token }`

**`getMe(userId)`:**
- `findById` → nếu null → `NotFoundError('User')`
- Return user

### `auth.controller.js`
Export 3 handlers wrap `asyncHandler`:
- `register`: extract body → service → `sendCreated(res, result, 'Đăng ký thành công')`
- `login`: extract body → service → `sendSuccess(res, result, 'Đăng nhập thành công')`
- `getMe`: `req.user.sub` → service → `sendSuccess(res, user)`

### `auth.middleware.js`
Export 2 functions:

**`authenticate`:**
1. Lấy `Authorization` header → check `Bearer ` prefix
2. Không có → `UnauthorizedError('Chưa đăng nhập')`
3. Verify JWT với JWT_SECRET
4. Gắn `req.user = { sub, email, role }`
5. Catch: TokenExpiredError → `'Phiên đăng nhập đã hết hạn'`, JsonWebTokenError → `'Token không hợp lệ'`

**`optionalAuth`** — giống nhưng không throw nếu thiếu token.

### `role.middleware.js`
Export `requireRole(...roles)`:
- Return middleware
- Check `req.user.role` in roles
- Nếu không → throw `ForbiddenError('Chỉ ${roles} mới có quyền')`
- Shorthand: `requireAdmin`, `requireStaff`, `requireCustomer`

### `auth.routes.js`
```
POST /register → validate(registerSchema) → register
POST /login    → validate(loginSchema) → login
GET  /me       → authenticate → getMe
```

Mount trong `app.js`: `app.use('/api/auth', authRoutes)`.

## Test
- Register OK → 201 + token
- Register trùng email → 409
- Login OK → 200 + token
- Login sai password → 401 (cùng message)
- Login tài khoản khóa → 403
- GET /me có token → 200
- GET /me không token → 401
- GET /me token sai → 401

## Điều kiện hoàn thành
- [ ] Tất cả endpoints hoạt động
- [ ] Validation đầy đủ
- [ ] Không trả password_hash
- [ ] Login fail dùng cùng message
- [ ] Token expiry handled
- [ ] Role middleware sẵn sàng

## Reference
- API contract: `docs/02-system-design/shared/01-api-contract.md` mục Auth
- Error codes: `docs/02-system-design/shared/03-error-codes.md` mục Auth