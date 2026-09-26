# Phase 4: Room Browsing

## Mục tiêu
Khách xem danh sách phòng + chi tiết phòng.

## Files cần tạo

```
src/api/
├── room.api.ts
└── roomType.api.ts

src/features/room/
├── components/
│   ├── RoomCard.tsx
│   ├── RoomFilter.tsx
│   └── RoomList.tsx
├── hooks/
│   ├── useRooms.ts
│   ├── useRoomDetail.ts
│   └── useRoomTypes.ts
└── pages/
    ├── RoomListPage.tsx
    └── RoomDetailPage.tsx
```

## Chi tiết

### `room.api.ts` + `roomType.api.ts`
Export object với methods:
- `list(params)` — GET /rooms với filter
- `getById(id)` — GET /rooms/:id
- `getAvailable(params)` — GET /rooms/available

### `useRooms.ts`
- State: `data: Room[]`, `pagination`, `loading`, `error`
- useEffect fetch khi filters đổi (dùng `JSON.stringify` làm dep)
- Cancellation flag để tránh setState sau unmount
- Return `{ data, pagination, loading, error, refetch }`

### `RoomListPage.tsx`
- Sync filters với URL query params (`useSearchParams`)
- Filter: room_type_id, floor, status
- Grid responsive: 1-2-3-4 cột
- Pagination
- Loading + Empty + Error states
- Reset page về 1 khi đổi filter

### `RoomCard.tsx`
- Image (aspect-video) từ `room.room_type.image_url`
- Badge status góc trên phải
- Room number badge góc trên trái
- Body: name + guests + floor + price
- Link "Chi tiết" tới `/rooms/:id`

### `RoomDetailPage.tsx`
- Layout 2 cột (desktop), 1 cột mobile
- Cột trái: ảnh lớn + description + amenities list
- Cột phải (sticky): status badge + name + price + button "Đặt phòng ngay"
- Button disabled nếu status !== 'available'
- Back button

### `RoomFilter.tsx`
- 3 dropdown: loại phòng, tầng, trạng thái
- Nút "Xóa bộ lọc"
- Callback `onChange(filters)` sync URL

## Test
- List rooms với filter sync URL
- Pagination
- Room detail hiển thị đúng
- Nút đặt phòng disable khi không available
- Responsive

## Điều kiện hoàn thành
- [ ] List + detail pages
- [ ] Filter sync URL
- [ ] Pagination
- [ ] Loading + Empty + Error
- [ ] Responsive
- [ ] Dark mode