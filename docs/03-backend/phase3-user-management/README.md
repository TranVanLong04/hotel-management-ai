# Phase 3: User Management

## Mục tiêu
Quản lý users (admin) và customer profile.

## Files cần tạo

```
src/modules/users/
├── users.controller.js
├── users.service.js
├── users.repository.js
├── users.routes.js
└── users.validation.js

src/modules/customers/
├── customers.controller.js
├── customers.service.js
├── customers.repository.js
├── customers.routes.js
└── customers.validation.js
```

## Chi tiết

### Users module

**Repository:**
- `list(filters)` — phân trang, filter theo role/is_active, search theo name/email
- `findById(id)` — select fields trừ password_hash
- `update(id, updates)` — UPDATE
- `softDelete(id)` — set `is_active = false`

**Service:**
- `listUsers(filters)` — pass-through
- `getUser(id)` — throw `NotFoundError('User')` nếu không có
- `updateUser(id, updates, currentUserId)`:
  - **Không cho admin tự đổi role của mình** → throw `ForbiddenError`
  - Update
- `updateStatus(id, isActive, currentUserId)`:
  - **Không cho tự khóa mình** → throw `ForbiddenError`
  - Update `is_active`
- `deleteUser(id, currentUserId)`:
  - **Không cho tự xóa mình** → throw `ForbiddenError`
  - Soft delete

**Routes** (tất cả require `authenticate` + `requireAdmin`):
- GET / — list
- GET /:id — detail
- PATCH /:id — update
- PATCH /:id/status — update status
- DELETE /:id — soft delete

### Customers module

**Repository:**
- `findByUserId(userId)` — return customer hoặc null
- `updateByUserId(userId, updates)`
- `list(filters)` — phân trang + search
- `findById(id)` — JOIN bookings gần đây

**Service:**
- `getMyProfile(userId)` — `findByUserId`, throw `NotFoundError` nếu null
- `updateMyProfile(userId, updates)`:
  - Check `identity_number` unique (nếu update field này)
  - Update
- `listCustomers(filters)`
- `getCustomerById(id)`

**Routes:**
- GET /me → authenticate (customer)
- PATCH /me → authenticate + requireCustomer + validate
- GET / → authenticate + requireStaff
- GET /:id → authenticate + requireStaff

**Route order:** `/me` phải đặt TRƯỚC `/:id`.

### Validation

**`updateProfileSchema`:**
- full_name (2-100) optional
- phone (regex 10-11) optional
- identity_number (9-12 số) optional
- date_of_birth (YYYY-MM-DD) optional
- gender (enum) optional
- address (max 500) optional

**`updateUserSchema`:**
- full_name, phone, role — optional

**`updateStatusSchema`:**
- is_active: boolean

## Test
- Admin list users với filter
- Admin update user OK
- Admin tự đổi role mình → 403
- Admin tự khóa mình → 403
- Customer GET /me → OK
- Customer PATCH /me với CCCD trùng → 409
- Staff list customers → OK
- Customer list customers → 403

## Điều kiện hoàn thành
- [ ] Users CRUD + self-protection
- [ ] Customers profile + list
- [ ] Search + filter + pagination
- [ ] Role guards đúng
- [ ] Route /me trước /:id

## Reference
- API contract: mục Users, Customers
- Error codes: USER_*, CUSTOMER_*