# Phase 1: Frontend Setup

## Mục tiêu
Setup Vite + React + TypeScript + TailwindCSS + Router + Axios + Zustand.

## Files cần tạo

```
source/frontend/
├── vite.config.ts           ← Alias imports
├── tailwind.config.js       ← Dark mode class, custom colors
├── tsconfig.json            ← strict: true
├── .env                     ← VITE_* variables
├── src/
│   ├── api/axios.ts         ← Axios instance + interceptors
│   ├── components/
│   │   ├── ui/              ← Button, Input, Select, Modal, Badge, Card
│   │   └── feedback/        ← Loading, ErrorBoundary
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useTheme.ts      ← Light/Dark mode
│   ├── routes/
│   │   ├── index.tsx
│   │   └── paths.ts
│   ├── stores/
│   │   └── authStore.ts
│   ├── types/
│   │   └── index.ts         ← Shared types
│   ├── utils/
│   │   ├── format.ts
│   │   └── errorHandler.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
```

## Chi tiết

### `vite.config.ts`
- Plugin: `@vitejs/plugin-react`
- Alias: `@` → `src`, `@api`, `@components`, `@features`, `@hooks`, `@layouts`, `@pages`, `@routes`, `@stores`, `@utils`, `@types`
- Server: port 5173, open true

### `tsconfig.json`
- `strict: true`
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `paths` cho aliases
- `jsx: react-jsx`

### `tailwind.config.js`
- `darkMode: 'class'`
- Extend colors: primary, success, warning, danger, info (đủ shades 50-900)
- Font family: Inter
- Box shadow: card, card-hover
- Animation: fade-in, slide-in

### `src/index.css`
- Tailwind directives
- Base: body bg-gray-50 dark:bg-gray-950, text-gray-900 dark:text-gray-100
- Component classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-outline`, `.card`, `.input`, `.label`, `.badge`

### `src/types/index.ts`
Định nghĩa **tất cả types** dùng chung:
- User, UserRole
- Customer
- RoomType, Room, RoomStatus
- Booking, BookingStatus, FaceVerificationStatus
- Service, ServiceUsage
- Invoice, InvoiceStatus
- Payment, PaymentMethod, PaymentStatus
- ApiResponse<T>, ApiError, PaginatedResponse<T>
- Filter params types

**Tất cả enum dùng union types** (`type X = 'a' | 'b'`), không dùng `enum`.

### `src/api/axios.ts`
- axios instance với `baseURL = import.meta.env.VITE_API_URL`, timeout 15s
- Request interceptor: gắn `Authorization: Bearer <token>` từ authStore
- Response interceptor:
  - Success → return `response.data`
  - 401 → logout + redirect login (trừ login/register endpoints)
  - 403, 400, 500 → toast error
- Export default axios instance

### `src/stores/authStore.ts`
- Zustand + persist
- State: `user: User | null`, `token: string | null`, `isAuthenticated: boolean`
- Actions: `login(user, token)`, `logout()`, `updateUser(updates)`
- Selectors: `hasRole(roles)`, `isAdmin()`, `isStaff()`, `isCustomer()`
- `partialize` chỉ persist user + token

### `src/hooks/useTheme.ts`
- Zustand store cho theme: `theme: 'light' | 'dark'`
- `toggleTheme()`, `initTheme()` — apply class `dark` lên `<html>`
- Persist vào localStorage với key `theme-storage`

### `src/utils/format.ts`
- `formatCurrency(amount)` — VND với `Intl.NumberFormat('vi-VN')`
- `formatNumber(num)`
- `formatDate(date, format = 'DD/MM/YYYY')`
- `formatDateTime(date)` — có giờ phút

### `src/utils/errorHandler.ts`
- `getErrorMessage(error, default)` — extract từ `error.response.data.error.message`
- `getErrorCode(error)`
- `isValidationError(error)` — check status 400 + có details
- `getValidationErrors(error)` — map về `{ field: message }`

### `src/components/ui/`
Các component với TypeScript props:

**`Button.tsx`**: Props `{ variant, size, loading, disabled, children, onClick }`
**`Input.tsx`**: ForwardRef, props `{ label, error, required, ...inputProps }`
**`Select.tsx`**: Props `{ label, options, error, ...selectProps }`
**`Modal.tsx`**: Props `{ open, onClose, title, children, size }` — ESC đóng, click outside đóng, body overflow hidden
**`Badge.tsx`**: Props `{ variant, children }`
**`Card.tsx`**: Wrapper với class `card`

### `src/components/feedback/`
**`Loading.tsx`**: Props `{ fullScreen?, size? }` — spinner
**`ErrorBoundary.tsx`**: Class component, catch lỗi, hiển thị fallback

### `src/routes/paths.ts`
Constant `PATHS` với tất cả route (xem `docs/02-system-design/frontend/03-routing.md`).

### `src/main.tsx`
- ReactDOM.createRoot
- `<RouterProvider router={router} />`
- `<Toaster position="top-right" />`
- Wrap trong ErrorBoundary

### `.env`
```
VITE_API_URL=http://localhost:3000/api
VITE_AI_URL=http://localhost:8000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Dependencies cần cài

```bash
pnpm add react-router-dom axios zustand
pnpm add react-hot-toast dayjs lucide-react
pnpm add react-hook-form zod @hookform/resolvers
pnpm add recharts
pnpm add -D typescript @types/react @types/react-dom @types/node
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

## Test
- `pnpm dev` chạy
- Alias `@/` hoạt động
- Toaster hiển thị
- Theme toggle đổi class `dark` trên `<html>`
- Axios instance sẵn sàng

## Điều kiện hoàn thành
- [ ] Vite + TS strict chạy
- [ ] Tailwind + dark mode
- [ ] Alias imports hoạt động
- [ ] Types định nghĩa đầy đủ
- [ ] Axios + interceptors
- [ ] Auth store persist
- [ ] Theme store
- [ ] UI components: Button, Input, Select, Modal
- [ ] Không có `any` type