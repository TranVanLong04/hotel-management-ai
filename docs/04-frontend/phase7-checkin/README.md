# Phase 7: Check-in AI

## Mục tiêu
**Trang quan trọng nhất của đồ án** — Lễ tân check-in bằng AI nhận diện khuôn mặt.

## Files cần tạo

```
src/api/checkin.api.ts

src/features/checkin/
├── components/
│   ├── BookingSearch.tsx
│   ├── BookingInfoCard.tsx
│   ├── FaceVerifyCamera.tsx
│   ├── VerificationResult.tsx
│   └── ManualCheckinForm.tsx
├── hooks/
│   └── useCheckin.ts
└── pages/
    └── CheckinPage.tsx
```

## Chi tiết

### `checkin.api.ts`
- `verify(bookingId, file)` — POST /checkin/:id/verify (multipart)
- `confirm(bookingId)` — POST /checkin/:id/confirm
- `manual(bookingId, data)` — POST /checkin/:id/manual

### `useCheckin.ts`
State: `verifying`, `attempts: number`
- `verify(bookingId, blob)`:
  - Set verifying true
  - Gọi API, catch error
  - Nếu success → reset attempts, return `{ success: true, data }`
  - Nếu fail → tăng attempts, return `{ success: false, code, message, attempts, canRetry: attempts < 3 }`
- `reset()` — reset attempts
- MAX_ATTEMPTS = 3

### `CheckinPage.tsx`
State: `booking`, `result`, `showManual`
Flow:
1. Nếu chưa có booking → hiển thị `<BookingSearch />`
2. Nếu có booking + chưa có result → `<BookingInfoCard />` + `<FaceVerifyCamera />`
   - Nếu customer chưa có face_profile → hiển thị alert + nút "Check-in thủ công"
3. Nếu fail → `<VerificationResult />` với retry button (nếu còn lượt) hoặc manual button
4. Nếu success → `<VerificationResult />` success + nút reset
5. Nếu `showManual` → `<ManualCheckinForm />`

### `BookingSearch.tsx`
- Form nhập mã booking
- Gọi `bookingApi.list({ search: code, limit: 1 })`
- Validate:
  - Không tìm thấy → toast
  - `status === 'checked_in'` → toast "Đã check-in"
  - `status === 'checked_out'` → toast "Đã check-out"
  - `status !== 'confirmed'` → toast "Chưa thể check-in"
- Nếu OK → `onFound(booking)`

### `BookingInfoCard.tsx`
- Hiển thị: booking_code, customer name + phone, room, dates, guests, total
- Badge face_verification_status với variant tương ứng
- Layout 2 cột info grid

### `FaceVerifyCamera.tsx`
- Wrap `useCamera` từ phase6
- Hiển thị số attempts hiện tại
- Nếu `attempts > 0` → warning banner
- Callback `onVerify({ blob, dataURL })`

### `VerificationResult.tsx`
Props: `{ result, onReset, onManual }`

Success case:
- Icon CheckCircle2 xanh lớn
- Tiêu đề "Check-in thành công!"
- Similarity %
- Card info booking (code, name, room, time)
- Nút "Check-in khách tiếp theo" → `onReset`

Fail case:
- Icon XCircle đỏ
- Message lỗi
- Similarity nếu có
- Nếu `canRetry` → nút "Thử lại (X/3)"
- Nếu hết lượt → info + nút "Check-in thủ công" → `onManual`

### `ManualCheckinForm.tsx`
- Warning banner vàng "Security event"
- Form: identity_number (9-12 số), reason (min 10 chars)
- Submit → `checkinApi.manual()` → onSuccess

## Test
- Search booking OK
- Search không tồn tại → toast
- Verify thành công → success screen
- Verify fail 1-2 lần → retry button
- Fail 3 lần → manual button
- Manual checkin OK
- Reset → về search

## Điều kiện hoàn thành
- [ ] Search + validate booking state
- [ ] Face verify flow đầy đủ
- [ ] Attempt counter
- [ ] Manual fallback sau 3 lần
- [ ] Success screen với đầy đủ info
- [ ] Dark mode
- [ ] Responsive