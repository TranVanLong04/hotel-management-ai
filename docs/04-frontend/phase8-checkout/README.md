# Phase 8: Checkout

## Mục tiêu
Trang check-out cho lễ tân: xem breakdown, thêm payments, tạo hóa đơn.

## Files cần tạo

```
src/api/checkout.api.ts
src/api/serviceUsage.api.ts

src/features/checkout/
├── components/
│   ├── InvoicePreview.tsx
│   ├── PaymentForm.tsx
│   └── PaymentList.tsx
└── pages/
    └── CheckoutPage.tsx
```

## Chi tiết

### `checkout.api.ts`
- `checkout(bookingId, data)` — POST /checkout/:id

### `serviceUsage.api.ts`
- `listByBooking(bookingId)` — GET /bookings/:id/services
- `add(bookingId, data)` — POST
- `remove(id)` — DELETE

### `CheckoutPage.tsx`
Flow:
1. Nhập mã booking → tìm booking `checked_in`
2. `<BookingInfoCard />` + `<InvoicePreview />` + `<PaymentForm />`
3. Sau khi submit → success screen

Reuse `BookingSearch` từ phase7 (đã validate state).

### `InvoicePreview.tsx`
Props: `{ booking, taxRate = 0.08, discountAmount = 0, onCalculated }`
- Fetch service usages của booking
- Tính:
  - `roomAmount = booking.room_subtotal`
  - `serviceAmount = SUM(service_usages.total_amount)`
  - `subtotal = roomAmount + serviceAmount - discountAmount`
  - `taxAmount = subtotal × taxRate`
  - `totalAmount = subtotal + taxAmount`
- Hiển thị breakdown line-by-line
- Gọi `onCalculated({ room_amount, service_amount, tax_amount, total_amount })` để parent biết total

### `PaymentForm.tsx`
- Nhận `totalAmount` từ parent
- State: `payments: Array<{ amount, method, transaction_code }>`
- Cho phép thêm nhiều payment rows
- Mỗi row: amount + method (select) + transaction_code (optional)
- Hiển thị "Còn lại: X ₫" real-time
- Validate: tổng payments = totalAmount
- Submit → `checkoutApi.checkout(bookingId, { discount_amount, tax_rate, payments })`

### `PaymentList.tsx`
- Hiển thị danh sách payments đã thêm
- Nút xóa từng payment

## Test
- Tìm booking checked_in
- Invoice breakdown tính đúng
- Thêm/xóa payment
- Validate tổng = total
- Submit → success
- Booking chưa checked_in → không cho tìm

## Điều kiện hoàn thành
- [ ] Tìm booking
- [ ] Breakdown chính xác
- [ ] Multiple payments
- [ ] Validate tổng
- [ ] Success screen
- [ ] Dark mode