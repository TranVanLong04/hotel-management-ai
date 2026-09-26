# Enums

## UserRole
`admin` | `staff` | `customer`

## Gender
`male` | `female` | `other`

## RoomStatus
`available` (Trống) | `reserved` (Đã đặt) | `occupied` (Đang ở) | `cleaning` (Đang dọn) | `maintenance` (Bảo trì)

## BookingStatus
`pending` | `confirmed` | `checked_in` | `checked_out` | `cancelled` | `no_show`

**State machine:**
```
pending → confirmed → checked_in → checked_out
   ↓          ↓
cancelled  cancelled/no_show
```

## FaceVerificationStatus
`pending` | `verified` | `failed` | `manual_review`

## InvoiceStatus
`unpaid` | `partial` | `paid` | `refunded`

## PaymentMethod
`cash` (Tiền mặt) | `bank_transfer` (CK) | `credit_card` | `online` | `other`

## PaymentStatus
`pending` | `completed` | `failed` | `refunded`

## Vietnamese Labels (cho FE)
```javascript
BOOKING_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã nhận phòng',
  checked_out: 'Đã trả phòng',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
}

ROOM_STATUS_LABELS = {
  available: 'Trống',
  reserved: 'Đã đặt',
  occupied: 'Đang ở',
  cleaning: 'Đang dọn',
  maintenance: 'Bảo trì',
}

PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  credit_card: 'Thẻ tín dụng',
  online: 'Online',
  other: 'Khác',
}

ROLE_LABELS = {
  admin: 'Quản trị viên',
  staff: 'Lễ tân',
  customer: 'Khách hàng',
}
```

## Color Mapping (Tailwind)
```javascript
BOOKING_STATUS_COLORS = {
  pending: 'yellow',
  confirmed: 'blue',
  checked_in: 'green',
  checked_out: 'gray',
  cancelled: 'red',
  no_show: 'orange',
}

ROOM_STATUS_COLORS = {
  available: 'green',
  reserved: 'blue',
  occupied: 'red',
  cleaning: 'yellow',
  maintenance: 'gray',
}
```