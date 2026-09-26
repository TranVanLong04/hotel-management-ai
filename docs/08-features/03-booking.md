# Feature: Booking

## Mục tiêu
Đặt phòng trực tuyến, snapshot giá, chống double booking.

## Actors
- Customer (đặt, hủy)
- Staff/Admin (confirm, cancel)
- System (check overlap ở DB)

## Preconditions
- Customer đã login
- Room active, không maintenance

## Postconditions
- Booking `status = 'pending'`
- `room_price` snapshot
- `room_subtotal` generated
- `booking_code` unique

## Business Rules
- check_out > check_in
- check_in ≥ hôm nay
- guests ≤ max_guests
- **KHÔNG overlap** với booking `confirmed`/`checked_in` của cùng phòng (DB exclusion constraint)
- Snapshot giá từ `room_types.base_price`
- `booking_code`: `BK` + `YYYYMMDD` + 3 số

## Flows

**Create booking:**
1. Chọn ngày + phòng + số khách
2. POST /api/bookings
3. Backend: verify customer + room + guests → snapshot price → insert (DB tự check exclusion)
4. Response 201

**Overlap:** DB raise `23P01` → BE catch → 409 BOOKING_OVERLAP → FE hiển thị error dưới field check_in_date.

**Confirm:** Staff gọi POST /:id/confirm → check `status === 'pending'` → update `confirmed`.

**Cancel:** Owner/Staff gọi POST /:id/cancel → check `status IN ('pending', 'confirmed')` → update `cancelled`.

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | /api/bookings | Auth (role-based list) |
| GET | /api/bookings/:id | Owner/Staff |
| POST | /api/bookings | Customer |
| POST | /api/bookings/:id/confirm | Staff |
| POST | /api/bookings/:id/cancel | Owner/Staff |

## Database
- `bookings` — INSERT, SELECT, UPDATE
- Exclusion constraint: `no_overlapping_bookings` với `daterange('[)')` và `status IN ('confirmed', 'checked_in')`

## UI Components
- `features/booking/pages/BookingPage.tsx`
- `features/booking/pages/MyBookingsPage.tsx`
- `features/booking/components/BookingForm.tsx`
- `features/booking/components/BookingCard.tsx`
- `features/booking/components/BookingStatusTabs.tsx`

## Tests
- Unit: create (guests exceed, snapshot), cancel (wrong state)
- Integration: overlap check với DB thật
- E2E: full booking flow

## Edge Cases
| Case | Xử lý |
|------|-------|
| check_out ≤ check_in | 400 BOOKING_INVALID_DATES |
| check_in < today | 400 BOOKING_PAST_DATE |
| guests > max | 409 BOOKING_GUESTS_EXCEED |
| Room not found | 404 |
| Room maintenance | 400 |
| Overlap | 409 BOOKING_OVERLAP |

## Related
- Room Browsing (`phase4`)
- Face Registration (`04`)
- Check-in AI (`05`)