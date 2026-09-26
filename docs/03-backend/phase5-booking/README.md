# Phase 5: Booking

## Mục tiêu
Nghiệp vụ đặt phòng — **bảng trung tâm** của hệ thống.

## Files cần tạo

```
src/modules/bookings/
├── bookings.controller.js
├── bookings.service.js
├── bookings.repository.js
├── bookings.routes.js
└── bookings.validation.js
```

## Chi tiết

### Validation

**`createBookingSchema`:**
- room_id (UUID)
- check_in_date, check_out_date (YYYY-MM-DD)
- number_of_guests (int, positive, ≤ 20)
- note (max 500, optional)
- Refine 1: check_out > check_in
- Refine 2: check_in ≥ hôm nay

**`listBookingsSchema`:** page, limit, status enum, customer_id, room_id, from, to, search

### Repository

Export:
- `findRoomWithType(roomId)` — query rooms JOIN room_types để lấy base_price, max_guests
- `findCustomerByUserId(userId)` — query customers
- `generateBookingCode()` — format `BK` + `YYYYMMDD` + 3 số sequence (đếm booking hôm nay + 1)
- `insert(data)` — handle PG 23P01 (exclusion violation) → `ConflictError('BOOKING_OVERLAP')`
- `findById(id)` — JOIN customer + room + room_type
- `listByCustomer(customerId, filters)` — pagination + filter status
- `listAll(filters)` — cho staff, có thêm filter customer_id, room_id, date range
- `updateStatus(id, status, extra)` — UPDATE với extra fields

### Service

**`createBooking(userId, data)`:**
1. `findCustomerByUserId` → nếu null → `NotFoundError('Customer')`
2. `findRoomWithType(data.room_id)` → nếu null → `NotFoundError('Room')`
3. Check `room.is_active` → nếu false → `BadRequestError('Phòng đã ngừng sử dụng')`
4. Check `room.status === 'maintenance'` → `BadRequestError('Phòng đang bảo trì')`
5. Check `data.number_of_guests > room.room_type.max_guests` → `ConflictError('BOOKING_GUESTS_EXCEED')`
6. Generate `booking_code`
7. **`insert` với `room_price = room.room_type.base_price`** (SNAPSHOT), `status = 'pending'`
8. Log
9. Return booking

**KHÔNG cần check overlap thủ công** — DB có exclusion constraint tự chặn.

**`listMyBookings(userId, filters)`:**
- `findCustomerByUserId` → `listByCustomer`

**`listAllBookings(filters)`:**
- `listAll`

**`getBooking(id, user)`:**
- `findById` → nếu null → NotFound
- Nếu `user.role === 'customer'`: check owner, không phải → `ForbiddenError`

**`confirmBooking(id, userId)`:**
- `findById` → NotFound nếu null
- Check `status === 'pending'` → nếu không → `ConflictError('BOOKING_CANNOT_CONFIRM', ...)`
- `updateStatus(id, 'confirmed')`
- Log

**`cancelBooking(id, user, reason)`:**
- `findById` → NotFound nếu null
- Nếu customer: check owner
- Check status IN ('pending', 'confirmed') → nếu không → `ConflictError('BOOKING_CANNOT_CANCEL')`
- `updateStatus(id, 'cancelled', { note: append reason })`
- Log

### Routes
```
POST /                → authenticate + requireCustomer + validate → create
GET  /                → authenticate → list (customer: own, staff: all)
GET  /:id             → authenticate → getById (ownership check)
POST /:id/confirm     → authenticate + requireStaff → confirm
POST /:id/cancel      → authenticate + validate → cancel
```

### State machine
Xem `docs/02-system-design/shared/04-enums.md` — BookingStatus.
Transition hợp lệ: `pending → confirmed → checked_in → checked_out`. Cancel từ `pending`/`confirmed`.

## Test
- Customer tạo booking OK → 201 với booking_code, room_price snapshot
- Booking overlap → 409 BOOKING_OVERLAP (test bằng cách tạo 2 booking cùng phòng overlap)
- Guests vượt max → 409
- Customer xem list chỉ thấy của mình
- Staff xem list thấy tất cả
- Staff confirm OK
- Staff confirm booking không phải pending → 409
- Customer cancel OK
- Customer cancel booking của người khác → 403

## Điều kiện hoàn thành
- [ ] Create booking với snapshot giá
- [ ] Overlap bị chặn bởi DB
- [ ] List theo role
- [ ] Confirm / cancel đúng state
- [ ] Ownership check
- [ ] booking_code format đúng

## Reference
- State machine: `docs/02-system-design/shared/04-enums.md`
- Exclusion constraint: `docs/02-system-design/backend/05-database-layer.md`