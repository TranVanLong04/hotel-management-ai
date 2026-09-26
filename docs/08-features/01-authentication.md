# Feature: Authentication

## Mục tiêu
Xác thực người dùng: đăng ký, đăng nhập, JWT, phân quyền.

## Actors
- Customer, Staff, Admin

## Preconditions
- Database `users` schema đã có
- Backend chạy với JWT_SECRET đã config

## Postconditions
- User login thành công → JWT token lưu ở client
- User logout → clear token, redirect /login
- Token hết hạn → auto logout

## Business Rules
- Email unique
- Password ≥ 8 ký tự, có chữ hoa + số
- JWT expires 7 ngày
- Bcrypt cost factor = 10
- Login fail dùng **cùng error message** (không tiết lộ email tồn tại)
- Tài khoản `is_active = false` → 403

## Flows

**Register:**
1. Form: email, password, full_name, phone
2. Validate client-side (zod)
3. POST /api/auth/register
4. Backend: check email unique → hash password → insert users (role customer) → insert customers → generate JWT
5. Response: `{ user, token }`
6. Frontend: save store → redirect home

**Login:**
1. Form: email, password
2. POST /api/auth/login
3. Backend: find user → compare bcrypt → check is_active → generate JWT
4. Response: `{ user, token }`

**Auto logout:**
- Axios interceptor catch 401 → clear store → toast → redirect /login

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Auth |
| GET | /api/auth/me | Auth |

## Database
- `users` — INSERT, SELECT
- `customers` — INSERT (khi register)

## UI Components
- `features/auth/pages/LoginPage.tsx`
- `features/auth/pages/RegisterPage.tsx`
- `features/auth/components/LoginForm.tsx`
- `features/auth/components/RegisterForm.tsx`
- `stores/authStore.ts`

## Tests
- Unit: auth.service (register, login với error cases)
- Integration: full API flow
- E2E: login → logout

## Edge Cases
| Case | Xử lý |
|------|-------|
| Email tồn tại | 409 AUTH_EMAIL_EXISTS |
| Password yếu | 400 VALIDATION_ERROR |
| Sai password | 401 (cùng message với email sai) |
| Tài khoản khóa | 403 FORBIDDEN |
| Token hết hạn | 401 + auto logout |

## Related
- User Management (`04-manage-users`)
- Customer Profile (`02-customer-profile`)