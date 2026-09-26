# Feature: Service Management

## Mục tiêu
Admin CRUD dịch vụ, staff thêm dịch vụ khách dùng vào booking.

## Actors
- Admin (CRUD)
- Staff (thêm usage)
- Customer (xem)

## Preconditions

**CRUD:** Admin đã login
**Thêm usage:** Booking `checked_in`, service active

## Postconditions
- Danh mục cập nhật
- Service usage có `unit_price` snapshot, `total_amount` generated

## Business Rules
- Service name unique
- Price ≥ 0
- **Soft delete** service (`is_active = FALSE`)
- **Chỉ thêm usage** khi booking `checked_in`
- **Snapshot `unit_price`** tại thời điểm dùng (quan trọng cho kế toán)
- Không xóa usage sau khi check-out

## Flows

**Admin CRUD:**
1. Table với search/sort/pagination
2. Create/edit: modal form
3. Delete: confirm dialog + soft delete
4. Toggle status từ ActionsMenu

**Staff thêm usage:**
1. Trong check-in hoặc booking detail
2. Modal: chọn service + quantity + note
3. POST /bookings/:bookingId/services
4. Backend: verify booking checked_in + service active → snapshot unit_price → insert

## API Endpoints

### Services
| Method | Path | Auth |
|--------|------|------|
| GET | /api/services | Public |
| POST | /api/services | Admin |
| PATCH | /api/services/:id | Admin |
| DELETE | /api/services/:id | Admin |

### Service Usages
| Method | Path | Auth |
|--------|------|------|
| GET | /api/bookings/:bookingId/services | Owner/Staff |
| POST | /api/bookings/:bookingId/services | Staff |
| DELETE | /api/service-usages/:id | Staff |

## Database
- `services` — CRUD
- `service_usages` — INSERT, SELECT, DELETE
- `unit_price` snapshot, `total_amount` generated

## UI Components
- `features/admin/pages/ManageServicesPage.tsx`
- `features/admin/components/services/ServiceForm.tsx`
- `features/admin/components/services/ServiceActionsMenu.tsx`
- `features/checkin/components/AddServiceModal.tsx`

## Tests
- Unit: unique name, snapshot giá
- Integration: full flow

## Edge Cases
| Case | Xử lý |
|------|-------|
| Name trùng | 409 SERVICE_NAME_EXISTS |
| Service inactive | 409 SERVICE_NOT_ACTIVE |
| Booking chưa check-in | 400 |
| Quantity ≤ 0 | 400 |
| Xóa service đã dùng | Soft delete OK |
| Xóa usage sau check-out | 400 |

## Related
- Checkout (`06`)
- Invoice (`08`)