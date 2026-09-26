# Phase 7: Check-in & Check-out

## Mục tiêu
**Nghiệp vụ trung tâm của đồ án** — Check-in bằng AI + Check-out.

## Files cần tạo

```
src/modules/checkin/
├── checkin.controller.js
├── checkin.service.js
├── checkin.routes.js
└── checkin.validation.js

src/modules/checkout/
├── checkout.controller.js
├── checkout.service.js
├── checkout.routes.js
└── checkout.validation.js
```

## Chi tiết

### Checkin Service

**Threshold:** cosine similarity ≥ 0.75
**Max attempts:** 3 lần (FE handle, BE chỉ log)

**`verifyCheckin(bookingId, file, staffUserId)`:**
1. Validate file (tồn tại, ≤ 5MB)
2. `bookingsRepo.findById(bookingId)` → NotFound
3. Check state:
   - Nếu `status === 'checked_in'` → `ConflictError('BOOKING_ALREADY_CHECKED_IN', 'Khách đã check-in rồi')`
   - Nếu `status !== 'confirmed'` → `ConflictError('BOOKING_NOT_CONFIRMED', ...)`
4. `facesRepo.findActiveByCustomerId(booking.customer_id)` → nếu null → `BadRequestError('Khách chưa đăng ký khuôn mặt...')`
5. Gọi `aiService.embedFace(file.buffer, ...)` → embedding mới
6. Gọi `aiService.compareFaces(embedding, faceProfile.face_embedding, 0.75)` → `{ similarity, is_match }`
7. **Log security event** với `{ bookingId, similarity, isMatch, staffUserId }`
8. Nếu `is_match`:
   - `bookingsRepo.updateStatus(bookingId, 'checked_in', { face_verification_status: 'verified', face_verified_at: now, face_match_score: similarity, actual_check_in_at: now })`
   - `roomsRepo.updateStatus(booking.room_id, 'occupied')`
   - Log success
   - Return `{ success: true, similarity, is_match: true, booking: updated }`
9. Nếu không match:
   - `updateStatus(bookingId, booking.status, { face_verification_status: 'failed', face_match_score: similarity })`
   - Throw `BadRequestError('Xác thực khuôn mặt thất bại (độ tương đồng X%). Vui lòng thử lại.')`

**`confirmCheckin(bookingId, staffUserId)`:**
- Check booking `status === 'confirmed'`
- Update `checked_in` với `actual_check_in_at`, KHÔNG có face score
- Update room → occupied
- Dùng khi AI fail nhưng staff xác nhận qua giấy tờ

**`manualCheckin(bookingId, { reason, identity_number }, staffUserId)`:**
- Check status `confirmed`
- Update `checked_in` với:
  - `face_verification_status: 'manual_review'`
  - `face_verified_at: now`
  - `actual_check_in_at: now`
  - `note: append "\n[Manual check-in] Lý do: {reason}; CCCD: {identity_number}"`
- Update room → occupied
- **Log ở level `warn`** — đây là SECURITY EVENT

### Checkout Service

**`checkout(bookingId, { discount_amount = 0, tax_rate, payments, note }, staffUserId)`:**
1. `findById` → NotFound
2. Check: `status === 'checked_out'` → `ConflictError('BOOKING_ALREADY_CHECKED_OUT')`
3. Check: `status !== 'checked_in'` → `ConflictError('BOOKING_NOT_CHECKED_IN')`
4. Query `service_usages` của booking → SUM total_amount
5. `room_amount = booking.room_subtotal`
6. `service_amount = SUM`
7. `subtotal = room + service - discount`
8. Nếu subtotal < 0 → `BadRequestError('Giảm giá vượt quá tổng tiền')`
9. `tax_amount = Math.round(subtotal * tax_rate * 100) / 100`
10. Generate `invoice_code`: `INV` + `YYYYMMDD` + 3 số
11. Insert invoice với:
    - `room_amount, service_amount, discount_amount, tax_rate, tax_amount`
    - `status: 'unpaid'`
    - **KHÔNG insert total_amount** (generated column)
12. Insert payments (array) với `status: 'completed'`, `paid_at: now`
13. Nếu payment fail → xóa invoice (rollback thủ công), throw `InternalError`
14. Tính `totalPaid`, so với `invoice.total_amount` → update status `'paid'` hoặc `'partial'`
15. Update booking → `checked_out`, `actual_check_out_at: now`
16. Update room → `cleaning`
17. Log
18. Return `{ booking, invoice, payments }`

### Routes
```
POST /api/checkin/:bookingId/verify  → authenticate + requireStaff + uploadImage + validate → verify
POST /api/checkin/:bookingId/confirm → authenticate + requireStaff → confirm
POST /api/checkin/:bookingId/manual  → authenticate + requireStaff + validate → manual
POST /api/checkout/:bookingId        → authenticate + requireStaff + validate → checkout
```

### Validation

**`manualCheckinSchema`:**
- reason: min 10 chars
- identity_number: regex 9-12 số

**`checkoutSchema`:**
- discount_amount: number nonnegative default 0
- tax_rate: number in [0, 1]
- payments: array min 1. Mỗi item: amount (positive), method enum, transaction_code optional, note optional

## Test
- Verify với embedding match (mock AI trả similarity 0.87) → 200, booking checked_in
- Verify với similarity 0.5 → 400
- Verify với booking đã checked_in → 409
- Verify với customer chưa có face → 400
- Manual checkin OK
- Checkout OK → invoice + payments
- Checkout khi chưa check-in → 409

## Điều kiện hoàn thành
- [ ] Verify checkin hoạt động với threshold 0.75
- [ ] Log mọi attempt
- [ ] Manual checkin log ở level warn
- [ ] Checkout tính tiền chính xác
- [ ] Invoice total_amount generated
- [ ] State machine đúng

## Reference
- Feature checkin: `docs/08-features/05-checkin-ai.md`
- Feature checkout: `docs/08-features/06-checkout.md`