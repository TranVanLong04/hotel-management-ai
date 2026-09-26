# Feature: Checkout

## Mục tiêu
Lễ tân check-out, tính hóa đơn, ghi nhận thanh toán, cập nhật trạng thái.

## Actors
- Staff
- Customer (nhận hóa đơn)

## Preconditions
- Booking `status = 'checked_in'`
- Room `occupied`

## Postconditions
- `booking.status = 'checked_out'`, `actual_check_out_at` set
- Invoice được tạo (`paid` hoặc `partial`)
- Payment(s) ghi nhận
- `room.status = 'cleaning'`

## Business Rules
- Chỉ check-out từ `checked_in`
- **Công thức:** `total = room_subtotal + service_amount - discount_amount + tax_amount`
- `tax_amount = (room + service - discount) × tax_rate`
- 1 booking ↔ 1 invoice (UNIQUE)
- 1 invoice ↔ N payments (nhiều lần trả)
- Snapshot `tax_rate`, `discount_rate` tại thời điểm lập
- Không cho xóa invoice

## Flows

```
Staff chọn booking checked_in
   ↓
Hiển thị breakdown: room + services + tax
   ↓
Nhập discount + tax_rate + payments
   ↓
Preview hóa đơn
   ↓
Submit
   ↓
Backend transaction:
   - INSERT invoice (total generated)
   - INSERT payments
   - UPDATE invoice status (paid/partial)
   - UPDATE booking = checked_out
   - UPDATE room = cleaning
   ↓
Response 200 + hiển thị hóa đơn
```

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | /api/checkout/:bookingId | Staff |
| GET | /api/invoices/:id | Owner/Staff |
| POST | /api/invoices/:id/payments | Staff |

## Database
- `bookings` — UPDATE status
- `rooms` — UPDATE status
- `invoices` — INSERT (total_amount generated)
- `payments` — INSERT
- `service_usages` — SELECT (SUM)

## UI Components
- `features/checkout/pages/CheckoutPage.tsx`
- `features/checkout/components/InvoicePreview.tsx`
- `features/checkout/components/PaymentForm.tsx`
- `features/checkout/components/PaymentList.tsx`

## Tests
- Unit: tính tiền chính xác, discount > total → error
- Integration: full flow với DB

## Edge Cases
| Case | Xử lý |
|------|-------|
| Chưa check-in | 409 BOOKING_NOT_CHECKED_IN |
| Đã check-out | 409 BOOKING_ALREADY_CHECKED_OUT |
| Discount > total | 400 |
| tax_rate ngoài [0, 1] | 400 |
| Payments rỗng | 400 |
| Total payment < total | Invoice `partial` |
| Total payment > total | 400 |

## Related
- Check-in AI (`05`)
- Service Management (`07`)
- Invoice & Payment (`08`)