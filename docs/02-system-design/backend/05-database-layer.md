# Database Layer

## Supabase clients

**`supabaseAdmin`** — service_role key, bypass RLS:
- Dùng cho 99% queries ở backend
- Không giới hạn bởi policy

**`supabase`** — anon key, bị RLS:
- Chỉ dùng khi cần impersonate user
- Hầu như không dùng ở backend

## Repository pattern

Mỗi module có 1 repository, export các function CRUD:

```javascript
// bookings.repository.js
export const insert = async (data) => {...}
export const findById = async (id) => {...}
export const findByCustomerId = async (customerId, { from, to }) => {...}
export const update = async (id, updates) => {...}
export const updateStatus = async (id, status, extra = {}) => {...}
```

## Query patterns

**Select với JOIN:**
```javascript
supabaseAdmin
  .from('bookings')
  .select(`
    *,
    customer:customers(full_name, phone),
    room:rooms(room_number, room_type:room_types(name))
  `)
  .eq('id', bookingId)
  .single()
```

**Filters:**
- `.eq('status', 'confirmed')`
- `.neq('status', 'cancelled')`
- `.gt('check_in_date', '2026-01-01')`
- `.in('status', ['confirmed', 'checked_in'])`
- `.is('deleted_at', null)`
- `.ilike('full_name', '%Long%')` — case-insensitive

**Pagination:**
```javascript
const from = (page - 1) * limit;
const to = from + limit - 1;

const { data, count } = await supabaseAdmin
  .from('bookings')
  .select('*', { count: 'exact' })
  .range(from, to);
```

**Insert:**
```javascript
supabaseAdmin.from('users').insert(data).select().single()
```

**Update:**
```javascript
supabaseAdmin.from('bookings').update({ status }).eq('id', id).select().single()
```

## Error handling từ Supabase

Supabase không throw, trả error object:
```javascript
const { data, error } = await supabaseAdmin.from('users').insert(...);

if (error) {
  switch (error.code) {
    case '23505': throw new ConflictError('DUPLICATE', 'Đã tồn tại');
    case '23503': throw new BadRequestError('Tham chiếu không hợp lệ');
    case '23P01': throw new ConflictError('BOOKING_OVERLAP', 'Phòng đã được đặt');
    default: throw error;
  }
}
```

## Transactions

Supabase JS SDK **không support transaction** trực tiếp. Có 3 cách:

1. **PostgreSQL Function (RPC)** — Khuyến nghị cho logic phức tạp
   - Viết function trong Supabase SQL Editor với `SECURITY DEFINER`
   - Gọi từ backend: `supabaseAdmin.rpc('function_name', { params })`

2. **Sequential + Rollback thủ công** — Cho logic đơn giản
   - Try/catch, nếu fail thì xóa record đã tạo

3. **Database constraints** — Tốt nhất
   - Dùng exclusion constraint, FK, CHECK
   - DB tự bảo vệ, không cần app logic

## Select fields
```javascript
// ❌ Lấy hết
.select('*')

// ✅ Chỉ lấy cần
.select('id, full_name, email')
```

## Best practices
- Dùng `supabaseAdmin` cho hầu hết queries
- Select chỉ field cần thiết
- Dùng `maybeSingle()` khi có thể null, `single()` khi chắc chắn có
- Luôn check `error`
- Handle PG error codes (23505, 23503, 23P01)
- Dùng DB constraints thay vì validate app