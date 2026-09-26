# Frontend Testing

## Setup
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event jsdom @vitest/coverage-v8
```

## Config trong `vite.config.ts`
- `test.environment: 'jsdom'`
- `test.globals: true`
- `test.setupFiles: './src/test-setup.ts'`
- Coverage provider: v8

## `src/test-setup.ts`
- Import `@testing-library/jest-dom`
- `afterEach(cleanup)`
- Mock `window.matchMedia` (cho dark mode test)
- Mock `IntersectionObserver`

## Test patterns

**Component test:**
- Render với props
- Assert text/role xuất hiện
- Fire event (click, type)
- Assert callback được gọi

**Form test:**
- Type vào input
- Submit
- Assert validation error hiển thị
- Mock API call
- Assert redirect/callback

**Hook test:**
- Dùng `renderHook` từ `@testing-library/react`
- Dùng `act()` cho state updates
- Dùng `vi.useFakeTimers()` cho debounce/throttle

## Cases cần test

- `Button`: render, click, loading, disabled
- `Input`: label, error, value change
- `DataTable`: render columns, sort, empty state
- `LoginForm`: validation, submit, error từ server
- `BookingForm`: validate date range, tính tiền
- `useDebounce`: delay, cancel previous timer
- `useAuth`: login, logout, isAdmin

## Best practices
- Test behavior, không test implementation (dùng `getByLabelText`, không dùng class selector)
- Dùng `userEvent` thay `fireEvent`
- Mock API với `vi.mock('@api/xxx')`
- Không test library code (React, Tailwind)

## Commands
```bash
pnpm test
pnpm test -- --coverage
pnpm test -- --ui
```