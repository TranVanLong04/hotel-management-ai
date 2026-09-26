# Phase 8: Service & Invoice

## Mục tiêu
CRUD dịch vụ, thêm dịch vụ vào booking, quản lý hóa đơn.

## Files cần tạo

```
src/modules/services/
├── services.controller.js
├── services.service.js
├── services.repository.js
├── services.routes.js
└── services.validation.js

src/modules/service-usages/
├── service-usages.controller.js
├── service-usages.service.js
├── service-usages.repository.js
└── service-usages.validation.js

src/modules/invoices/
├── invoices.controller.js
├── invoices.service.js
├── invoices.repository.js
├── invoices.routes.js
└── invoices.validation.js
```

## Chi tiết

### Services CRUD

**Repository:** list (filter is_active), findById, findByName (check unique), insert (handle 23505 → SERVICE_NAME_EXISTS), update, softDelete

**Service:**
- `createService(data, userId)` — check name unique → insert → log
- `updateService(id, updates, userId)`
- `deleteService(id, userId)` — soft delete

**Routes:**
- GET / — public
- POST / — admin
- PATCH /:id — admin
- DELETE /:id — admin

**Validation `createServiceSchema`:** name (2-100), description (max 500), price (≥ 0), unit (1-30)

### Service Usages

**Repository:**
- `listByBooking(bookingId)` — JOIN service
- `insert(data)` — INSERT với `unit_price` snapshot
- `findById(id)`
- `remove(id)` — hard delete (dịch vụ chưa có gì ràng buộc)

**Service:**
- `addService(bookingId, data, userId)`:
  1. `bookingsRepo.findById` → NotFound
  2. **Check `booking.status === 'checked_in'`** → nếu không → `BadRequestError('Chỉ có thể thêm dịch vụ khi khách đang ở')`
  3. `servicesRepo.findById(data.service_id)` → NotFound
  4. Check `is_active` → `BadRequestError('Dịch vụ đã ngừng cung cấp')`
  5. Insert với **`unit_price: service.price`** (SNAPSHOT)
  6. Log
  7. Return usage
- `listBookingServices(bookingId, user)` — ownership check nếu customer
- `removeServiceUsage(id, userId)`:
  1. `findById` → NotFound
  2. `bookingsRepo.findById(usage.booking_id)`
  3. **Nếu booking `checked_out`** → `BadRequestError('Không thể xóa dịch vụ sau khi đã check-out')`
  4. Delete

**Routes:**
- POST /bookings/:bookingId/services → authenticate + requireStaff + validate
- GET /bookings/:bookingId/services → authenticate
- DELETE /service-usages/:id → authenticate + requireStaff

**Validation `addServiceUsageSchema`:** service_id (UUID), quantity (int > 0, ≤ 100), note optional

### Invoices

**Repository:**
- `list(filters)` — filter status, customer_id, booking_id, date range. JOIN booking + customer + payments
- `findById(id)` — full JOIN
- `insertPayment(paymentData)`
- `updateStatus(id, status)`

**Service:**
- `listInvoices(filters, user)` — nếu customer → filter theo customer_id của mình
- `getInvoice(id, user)`:
  - `findById` → NotFound
  - Nếu customer → check owner → `ForbiddenError`
- `addPayment(invoiceId, paymentData, staffUserId)`:
  1. `findById` → NotFound
  2. Nếu `status === 'paid'` → `BadRequestError('Hóa đơn đã được thanh toán đủ')`
  3. Tính `totalPaid = SUM(payments completed amount)`
  4. `remaining = total_amount - totalPaid`
  5. Nếu `paymentData.amount > remaining` → `BadRequestError('Số tiền vượt quá số còn lại (còn X)')`
  6. Insert payment với `status: 'completed'`, `paid_at: now`
  7. `newTotal = totalPaid + amount`
  8. Update invoice status: `'paid'` nếu `newTotal >= total_amount`, ngược lại `'partial'`
  9. Log
  10. Return `{ invoice, payment }`

**Routes:**
- GET / — authenticate (customer chỉ thấy của mình)
- GET /:id — authenticate
- POST /:id/payments — authenticate + requireStaff + validate

**Validation `addPaymentSchema`:** amount (positive), method enum, transaction_code optional, note optional

## Test
- Public list services
- Admin CRUD service
- Thêm service khi booking chưa checked_in → 400
- Thêm service OK → snapshot unit_price
- Xóa service usage sau check-out → 400
- Customer list invoices chỉ thấy của mình
- Add payment OK → update status paid
- Add payment vượt remaining → 400

## Điều kiện hoàn thành
- [ ] Services CRUD
- [ ] Service usages với snapshot giá
- [ ] Chỉ thêm service khi checked_in
- [ ] Invoices list + detail
- [ ] Add payment validation
- [ ] Auto update invoice status

## Reference
- Feature service: `docs/08-features/07-service-management.md`
- Feature invoice: `docs/08-features/08-invoice-payment.md`