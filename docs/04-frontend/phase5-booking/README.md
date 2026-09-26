# Phase 5: Booking

## Mục tiêu
Form đặt phòng + danh sách booking của khách.

## Files cần tạo

```
src/api/booking.api.ts
src/stores/bookingStore.ts

src/features/booking/
├── components/
│   ├── BookingForm.tsx
│   ├── BookingCard.tsx
│   ├── BookingList.tsx
│   └── BookingStatusTabs.tsx
├── hooks/
│   ├── useCreateBooking.ts
│   └── useMyBookings.ts
└── pages/
    ├── BookingPage.tsx
    └── MyBookingsPage.tsx
```

## Chi tiết

### `booking.api.ts`
Methods: `list(params)`, `getById(id)`, `create(data)`, `cancel(id, reason)`, `confirm(id)`

### `bookingStore.ts`
Zustand store cho wizard đặt phòng:
- State: `checkInDate`, `checkOutDate`, `selectedRoom`, `numberOfGuests`, `faceImage`, `currentStep`
- Actions: `setDates`, `setRoom`, `setGuests`, `nextStep`, `prevStep`, `reset`
- Getters: `getNights()`, `getTotalPrice()`
- **KHÔNG persist** (tránh lộ data)

### `BookingPage.tsx`
- Layout 2 cột: form bên trái, info phòng bên phải (sticky)
- Nhận `roomId` từ URL
- Fetch room detail
- Sau khi tạo booking thành công → redirect `/my-bookings`

### `BookingForm.tsx`
- Form fields: check_in_date, check_out_date, number_of_guests, note
- Zod schema:
  - check_out > check_in
  - check_in >= today
  - guests ≤ max_guests (validate sau khi có room)
- **Tính tổng tiền real-time**: `nights × base_price`
- Submit → `useCreateBooking`
- Error handling:
  - `BOOKING_OVERLAP` → `setError('check_in_date', ...)`
  - `BOOKING_GUESTS_EXCEED` → `setError('number_of_guests', ...)`
  - Khác → toast

### `MyBookingsPage.tsx`
- Tabs status filter (all/pending/confirmed/checked_in/checked_out/cancelled)
- Sync tab với URL query
- List BookingCard
- Pagination
- Empty state với CTA "Xem phòng"

### `BookingCard.tsx`
- Header: booking_code (mono font) + status badge + face status badge (nếu confirmed/checked_in)
- Room info: number + type
- Dates + guests
- Total price bên phải
- Actions:
  - "Chi tiết" (link)
  - "Đăng ký khuôn mặt" (nếu pending) → link `/face-register`
  - "Hủy" (nếu pending/confirmed) → ConfirmDialog

### `useMyBookings.ts`
Hook giống `useRooms`:
- Return `{ data, pagination, loading, error, refetch }`

## Test
- Form đặt phòng tính tổng tiền real-time
- Submit OK → redirect /my-bookings
- Overlap → error dưới check_in_date
- Guests exceed → error dưới guests
- Tabs filter hoạt động
- Cancel với confirm dialog
- Refetch sau cancel

## Điều kiện hoàn thành
- [ ] Booking form với validation
- [ ] Real-time price summary
- [ ] My bookings với tabs
- [ ] Cancel flow
- [ ] Empty + Loading + Error
- [ ] Dark mode