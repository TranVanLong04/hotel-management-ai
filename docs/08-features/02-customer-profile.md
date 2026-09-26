# Feature: Customer Profile

## Mục tiêu
Khách hàng xem và cập nhật hồ sơ cá nhân.

## Actors
- Customer (chính)
- Staff/Admin (xem)

## Preconditions
- Customer đã login
- Có record trong `customers` (tạo tự động khi register)

## Postconditions
- Profile được update vào DB
- Toast success

## Business Rules
- **CCCD unique** — không trùng customer khác
- CCCD format: 9-12 chữ số
- SĐT: 10-11 chữ số
- Ngày sinh không được tương lai
- **Email không thể thay đổi**
- **Không xóa profile** — chỉ update

## Flows

**Xem/Update profile:**
1. Vào `/my-profile`
2. GET /api/customers/me
3. Hiển thị form với data
4. User chỉnh sửa
5. PATCH /api/customers/me
6. Backend validate + check CCCD unique + update
7. Response 200 + toast

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | /api/customers/me | Customer |
| PATCH | /api/customers/me | Customer |
| GET | /api/customers | Staff/Admin |
| GET | /api/customers/:id | Staff/Admin |

## Database
- `customers` — SELECT, UPDATE

## UI Components
- `features/profile/pages/ProfilePage.tsx`
- `features/profile/components/ProfileForm.tsx`

## Tests
- Unit: update logic, CCCD unique check
- Integration: full flow

## Edge Cases
| Case | Xử lý |
|------|-------|
| Chưa điền CCCD | Cho phép (optional) |
| CCCD trùng | 409 CUSTOMER_IDENTITY_EXISTS |
| SĐT sai | 400 VALIDATION_ERROR |
| Ngày sinh tương lai | 400 |
| Chưa có customer record | Tự tạo khi GET |

## Related
- Authentication (`01`)
- Face Registration (`04`)