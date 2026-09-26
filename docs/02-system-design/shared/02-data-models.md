# Data Models

> Field names giữ nguyên `snake_case` từ database.

## User
```
id: UUID
username: string
full_name: string
email: string
phone: string | null
role: 'admin' | 'staff' | 'customer'
is_active: boolean
created_at: ISO string
updated_at: ISO string
```
**KHÔNG trả `password_hash`.**

## Customer
```
id: UUID
user_id: UUID | null       ← NULL nếu khách vãng lai
full_name: string
email: string | null
phone: string
identity_number: string | null    ← CCCD/CMND
date_of_birth: YYYY-MM-DD | null
gender: 'male' | 'female' | 'other' | null
address: string | null
created_at, updated_at
```

## FaceProfile
```
id: UUID
customer_id: UUID
face_image_url: string
face_embedding: number[]   ← 512 floats — KHÔNG trả về FE
model_version: string      ← 'arcface-r100-v1'
is_active: boolean
created_at, updated_at
```

## RoomType
```
id: UUID
name: string
description: string | null
max_guests: number
base_price: number         ← VND
amenities: string | null   ← CSV
image_url: string | null
is_active: boolean
created_at, updated_at
```

## Room
```
id: UUID
room_number: string        ← '101', 'A101', 'VIP01'
room_type_id: UUID
floor: number | null
status: 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance'
description, is_active
created_at, updated_at
room_type?: RoomType       ← khi JOIN
```

## Booking
```
id: UUID
booking_code: string       ← 'BK20260925001'
customer_id: UUID
room_id: UUID
check_in_date: YYYY-MM-DD
check_out_date: YYYY-MM-DD
number_of_nights: number   ← generated
number_of_guests: number
actual_check_in_at: ISO | null
actual_check_out_at: ISO | null
room_price: number         ← snapshot
room_subtotal: number      ← generated = price × nights
status: BookingStatus
face_verification_status: 'pending' | 'verified' | 'failed' | 'manual_review'
face_verified_at: ISO | null
face_match_score: number | null    ← [0, 1]
note: string | null
created_at, updated_at
customer?: Customer
room?: Room
```

## Service
```
id: UUID
name: string
description: string | null
price: number              ← giá hiện tại
unit: string               ← 'lần', 'chai', 'ngày'
is_active: boolean
created_at, updated_at
```

## ServiceUsage
```
id: UUID
booking_id: UUID
service_id: UUID
quantity: number
unit_price: number         ← snapshot
total_amount: number       ← generated
used_at: ISO
note: string | null
service?: Service
```

## Invoice
```
id: UUID
invoice_code: string       ← 'INV20261005001'
booking_id: UUID           ← UNIQUE
customer_id: UUID
room_amount: number
service_amount: number
discount_rate: number | null
discount_amount: number
tax_rate: number           ← [0, 1]
tax_amount: number
total_amount: number       ← generated
status: 'unpaid' | 'partial' | 'paid' | 'refunded'
issued_at, created_at
```

## Payment
```
id: UUID
invoice_id: UUID
amount: number
refunded_amount: number    ← [0, amount]
method: 'cash' | 'bank_transfer' | 'credit_card' | 'online' | 'other'
status: 'pending' | 'completed' | 'failed' | 'refunded'
transaction_code: string | null
paid_at: ISO | null
note: string | null
created_at
```

## API Response Wrappers
```typescript
ApiResponse<T> = { success: true, data: T, message?: string }
ApiError = { success: false, error: { code, message, details? } }
PaginatedResponse<T> = { success: true, data: T[], pagination: {...} }
```