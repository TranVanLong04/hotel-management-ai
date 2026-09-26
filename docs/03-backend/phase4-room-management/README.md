# Phase 4: Room Management

## Mục tiêu
Quản lý loại phòng và phòng cụ thể.

## Files cần tạo

```
src/modules/room-types/
├── room-types.controller.js
├── room-types.service.js
├── room-types.repository.js
├── room-types.routes.js
└── room-types.validation.js

src/modules/rooms/
├── rooms.controller.js
├── rooms.service.js
├── rooms.repository.js
├── rooms.routes.js
└── rooms.validation.js
```

## Chi tiết

### Room Types

**Repository:**
- `list(filters)` — pagination, filter is_active (default true), search name
- `findById(id)`
- `findByName(name)` — check unique
- `insert(data)` — handle PG 23505 → `ROOM_TYPE_NAME_EXISTS`
- `update(id, updates)`
- `softDelete(id)`
- `countActiveRooms(roomTypeId)` — dùng để check trước khi xóa

**Service:**
- `createRoomType(data, userId)`:
  - Check name unique
  - Insert
  - Log
- `updateRoomType(id, updates, userId)`:
  - Check tồn tại
  - Nếu update name → check unique lại
  - Update
- `deleteRoomType(id, userId)`:
  - **Không cho xóa nếu còn `rooms` active dùng type này** → throw `ROOM_TYPE_IN_USE`
  - Soft delete

**Routes:**
- GET / — public
- GET /:id — public
- POST / — admin
- PATCH /:id — admin
- DELETE /:id — admin

### Rooms

**Repository:**
- `list(filters)` — filter status/room_type_id/floor, JOIN room_types
- `findById(id)` — JOIN
- `findByRoomNumber(number)` — check unique
- `insert(data)` — handle PG 23505 → `ROOM_NUMBER_EXISTS`, 23503 → `BadRequestError('Loại phòng không tồn tại')`
- `update(id, updates)`
- `updateStatus(id, status)`
- `hasActiveBooking(roomId)` — count bookings với status IN ('confirmed', 'checked_in')
- `findAvailable({ checkIn, checkOut, guests, roomTypeId })` — xem logic bên dưới

**Logic `findAvailable` (quan trọng):**
1. Query tất cả `room_id` có booking overlap: `check_in_date < checkOut AND check_out_date > checkIn`, status IN ('confirmed', 'checked_in')
2. Query rooms `is_active = TRUE`, status IN ('available', 'reserved'), NOT IN danh sách bị đặt
3. Filter theo `guests <= max_guests` (làm ở JS sau khi JOIN)

**Service:**
- `createRoom` — check room_number unique, check room_type exists
- `updateRoom` — check unique nếu đổi room_number
- `updateRoomStatus(id, status, userId)` — dùng cho staff đổi available/cleaning
- `deleteRoom(id, userId)`:
  - **Không cho xóa nếu có active booking** → `ROOM_HAS_ACTIVE_BOOKING`
  - Soft delete

**Routes:**
- GET / — public
- GET /available — public (đặt TRƯỚC /:id)
- GET /:id — public
- POST / — admin
- PATCH /:id — admin
- PATCH /:id/status — staff/admin
- DELETE /:id — admin

### Validation

**`createRoomTypeSchema`:** name, description, max_guests (positive, ≤ 20), base_price (≥ 0), amenities, image_url (URL)

**`createRoomSchema`:** room_number (1-20 chars, regex alphanumeric + `-`), room_type_id (UUID), floor (int), description

**`updateStatusSchema`:** status enum

**`availableRoomsSchema`:** query có check_in, check_out (YYYY-MM-DD), guests (default 1), room_type_id optional. Refine: check_out > check_in.

## Test
- Public list room types
- Admin CRUD room type
- Xóa room type có phòng → 409
- Public list rooms
- `GET /available?check_in=&check_out=` → chỉ trả phòng không overlap
- Admin CRUD rooms
- Staff đổi status phòng
- Xóa room có active booking → 409

## Điều kiện hoàn thành
- [ ] Room types CRUD đầy đủ
- [ ] Rooms CRUD đầy đủ
- [ ] Tìm phòng trống hoạt động
- [ ] Route order `/available` trước `/:id`
- [ ] Business rules: unique name/number, không xóa khi in-use
- [ ] Filter + search + pagination

## Reference
- Pattern CRUD: `phase3-user-management`
- Room status enum: `docs/02-system-design/shared/04-enums.md`