# Phase 2: Auth Pages

## Mục tiêu
Login, Register, PublicRoute guard, redirect sau login.

## Files cần tạo

```
src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── hooks/
│   └── useAuthActions.ts
└── pages/
    ├── LoginPage.tsx
    └── RegisterPage.tsx

src/routes/
└── PublicRoute.tsx
```

## Chi tiết

### `useAuthActions.ts`
Custom hook wrap API + store:
- `handleLogin(credentials)` — gọi `authApi.login`, save vào authStore, return user
- `handleRegister(payload)` — gọi `authApi.register`, save vào authStore
- `handleLogout()` — gọi `authApi.logout` (ignore lỗi), clear store, toast
- `refreshUser()` — gọi `authApi.getMe`, update store

### `LoginForm.tsx`
- Dùng `react-hook-form` + `zodResolver` với schema:
  - email valid
  - password min 1
- State `showPassword` (toggle eye icon)
- Submit → `handleLogin`
- Error handling:
  - `UNAUTHORIZED` / `AUTH_INVALID_CREDENTIALS` → `setError('password', ...)`
  - `FORBIDDEN` / `AUTH_ACCOUNT_DISABLED` → `setError('email', ...)`
  - Khác → toast error
- Props: `{ onSuccess: () => void }`
- Loading state disable nút

### `RegisterForm.tsx`
- Schema zod:
  - full_name (2-100)
  - email valid
  - phone (regex 10-11 số)
  - password (min 8, có chữ hoa, có số)
  - confirm_password match password (dùng `.refine`)
- Error `AUTH_EMAIL_EXISTS` → `setError('email', ...)`
- Auto-login sau register thành công

### `LoginPage.tsx`
Layout:
- Container centered max-w-md
- Title "Đăng nhập" + subtitle
- Card chứa `LoginForm`
- Footer link "Chưa có tài khoản? Đăng ký"
- Redirect về `location.state.from` sau login

### `RegisterPage.tsx`
Tương tự, form đăng ký, link tới login.

### `PublicRoute.tsx`
- Nếu user đã login → `<Navigate to="/" />`
- Ngược lại → render children

## Test
- Login thành công → redirect
- Login sai → error dưới password
- Login tài khoản khóa → error dưới email
- Register thành công → auto login → redirect
- Register email trùng → error
- User đã login vào /login → redirect home

## Điều kiện hoàn thành
- [ ] Login + Register page
- [ ] Form validation đầy đủ
- [ ] Error handling từ server
- [ ] PublicRoute redirect
- [ ] Loading state
- [ ] Không dùng alert/confirm native