# API Contract — Hợp đồng FE ↔ BE

## Base URL
- Dev: `http://localhost:3000/api`
- Prod: `https://api.hotel-ai.com/api`

## Response format chuẩn

**Success:**
```json
{ "success": true, "data": {}, "message": "..." }
```

**Error:**
```json
{ "success": false, "error": { "code": "...", "message": "...", "details": null } }
```

**List (có pagination):**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1, "limit": 20, "total": 100,
    "totalPages": 5, "hasNext": true, "hasPrev": false
  }
}
```

## Auth header
`Authorization: Bearer <jwt>`

## Endpoints

### 🔐 Auth
- **POST** `/auth/register` — Body: email, password, full_name, phone → 201 `{ user, token }`
- **POST** `/auth/login` — Body: email, password → 200 `{ user, token }`
- **POST** `/auth/logout` — Auth → 200
- **GET** `/auth/me` — Auth → 200 `{ user }`

### 🚪 Room Types
- **GET** `/room-types` — Public, có pagination + search
- **GET** `/room-types/:id` — Public
- **POST** `/room-types` — Admin — Body: name, description, max_guests, base_price, amenities, image_url
- **PATCH** `/room-types/:id` — Admin
- **DELETE** `/room-types/:id` — Admin (soft delete)

### 🛏️ Rooms
- **GET** `/rooms` — Public, filter: status, room_type_id, floor
- **GET** `/rooms/available?check_in=&check_out=&guests=` — Public
- **GET** `/rooms/:id` — Public
- **POST** `/rooms` — Admin — Body: room_number, room_type_id, floor, description
- **PATCH** `/rooms/:id` — Admin
- **PATCH** `/rooms/:id/status` — Staff/Admin — Body: { status }
- **DELETE** `/rooms/:id` — Admin (soft delete)

### 📅 Bookings
- **GET** `/bookings` — Auth
  - Customer: chỉ thấy booking của mình
  - Staff/Admin: thấy tất cả, filter theo status/customer_id/date range
- **GET** `/bookings/:id` — Auth (owner hoặc staff)
- **POST** `/bookings` — Customer — Body: room_id, check_in_date, check_out_date, number_of_guests, note
- **PATCH** `/bookings/:id` — Owner (chỉ note, guests)
- **POST** `/bookings/:id/confirm` — Staff
- **POST** `/bookings/:id/cancel` — Owner/Staff — Body: { reason }

### 🤖 Face
- **GET** `/faces/me` — Customer → 200 `{ profile }` hoặc 404
- **POST** `/faces/register` — Customer — Multipart `image`

### ✅ Check-in
- **POST** `/checkin/:bookingId/verify` — Staff — Multipart `image`
- **POST** `/checkin/:bookingId/confirm` — Staff
- **POST** `/checkin/:bookingId/manual` — Staff — Body: { reason, identity_number }

### 🚪 Check-out
- **POST** `/checkout/:bookingId` — Staff
  Body: `{ discount_amount, tax_rate, payments: [{ amount, method, transaction_code }] }`

### 💼 Services
- **GET** `/services` — Public
- **POST** `/services` — Admin
- **PATCH** `/services/:id` — Admin
- **DELETE** `/services/:id` — Admin
- **GET** `/bookings/:bookingId/services` — Owner/Staff
- **POST** `/bookings/:bookingId/services` — Staff — Body: { service_id, quantity, note }
- **DELETE** `/service-usages/:id` — Staff

### 💰 Invoices
- **GET** `/invoices` — Staff/Admin (customer chỉ thấy của mình)
- **GET** `/invoices/:id` — Owner/Staff
- **POST** `/invoices/:id/payments` — Staff — Body: { amount, method, transaction_code }

### 📊 Reports (Admin)
- **GET** `/reports/dashboard` — Stats tổng quan
- **GET** `/reports/revenue?from=&to=&group_by=day|week|month`
- **GET** `/reports/occupancy?from=&to=`
- **GET** `/reports/bookings-by-status`

## Endpoint pattern
```
GET    /api/<resource>          # List
GET    /api/<resource>/:id      # Detail
POST   /api/<resource>          # Create
PATCH  /api/<resource>/:id      # Update
DELETE /api/<resource>/:id      # Delete
POST   /api/<resource>/:id/<action>  # Action
```

## Query params chuẩn
- `page`, `limit` (default 1, 20; max 100)
- `sort`, `order` (`asc` | `desc`)
- `search` (case-insensitive)
- Resource-specific filters

## HTTP Status Codes
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable
- 500 Internal Error, 503 Service Unavailable