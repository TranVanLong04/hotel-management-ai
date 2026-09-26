# E2E Testing

## Setup
```bash
cd source/frontend
pnpm add -D @playwright/test
pnpm dlx playwright install
```

## Config `playwright.config.ts`
- `testDir: './e2e'`
- `baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173'`
- `fullyParallel: false`, `workers: 1`
- `retries: process.env.CI ? 2 : 0`
- Reporter: html + list
- Screenshot: only-on-failure
- Video: retain-on-failure
- Auto start webServer với `pnpm dev`

## Scenarios cần test

### 1. Booking flow (`booking.spec.ts`)
- Login as customer
- Navigate `/rooms`
- Click room card → detail → "Đặt phòng ngay"
- Fill check_in/out dates
- Submit → redirect `/my-bookings` + toast success
- Test invalid date range → error

### 2. Check-in AI flow (`checkin.spec.ts`) ⭐
- Login as staff
- Navigate `/staff/checkin`
- Search booking code
- Verify booking info shown
- Camera section ready
- Test non-existent booking → error toast
- Test booking without face profile → warning + manual button

### 3. Face registration (`face-registration.spec.ts`)
- Grant camera permission
- Login as customer
- Navigate `/face-register`
- Camera flow visible
- Test permission denied → error message

### 4. Admin CRUD (`admin.spec.ts`)
- Login as admin
- Navigate `/admin/services`
- Create new service → toast + xuất hiện trong table
- Delete service → confirm dialog → toast
- Toggle status

### 5. Dark mode (`dark-mode.spec.ts`)
- Load home
- Assert `<html>` không có class `dark`
- Click theme toggle
- Assert có class `dark`
- Reload → vẫn dark (persist)

## Best practices
- Dùng `data-testid` cho element quan trọng
- Chạy tuần tự (workers: 1) tránh race condition
- Setup data test qua API trước khi test UI
- Screenshot/video khi fail
- Retry khi CI (2 lần)

## Commands
```bash
pnpm exec playwright test
pnpm exec playwright test --headed
pnpm exec playwright test --debug
pnpm exec playwright codegen http://localhost:5173
pnpm exec playwright show-report
```

## Không nên
- Test quá nhiều case (E2E chậm)
- Phụ thuộc order của test
- Dùng CSS class làm selector
- Test UI chi tiết (đã có unit test)