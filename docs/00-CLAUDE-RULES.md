# Quy tắc AI PHẢI tuân theo

## 🚫 KHÔNG ĐƯỢC

### Package manager
- Dùng npm hoặc yarn → **CHỈ dùng pnpm**
- Dùng npx → dùng `pnpm dlx`

### Bảo mật
- Đưa `SUPABASE_SERVICE_ROLE_KEY` vào frontend
- Hardcode secret trong code (dùng `.env`)
- Log password, token, embedding
- Trả `password_hash` về client
- Commit file `.env`

### Code
- Dùng `console.log` → dùng `logger`
- Dùng `==` → dùng `===`
- Dùng `var` → dùng `const`/`let`
- Dùng FLOAT cho tiền → dùng NUMERIC
- Dùng TIMESTAMP → dùng TIMESTAMPTZ
- Xóa cứng dữ liệu → soft delete
- Dùng `any` trong TS nếu không cần
- Tạo route trong app.js trực tiếp → tách module

### Git
- Commit trực tiếp lên `main` hoặc `develop`
- Force push lên nhánh đã share

## ✅ PHẢI

### Trước khi code
- Đọc file phase tương ứng trong `docs/`
- Kiểm tra API contract ở `docs/02-system-design/shared/01-api-contract.md`
- Kiểm tra enum ở `docs/02-system-design/shared/04-enums.md`
- Kiểm tra error code ở `docs/02-system-design/shared/03-error-codes.md`

### Khi code
- Validate input với Zod (BE)
- Dùng `asyncHandler` cho controllers
- Response format chuẩn
- Naming đúng convention
- Comment tiếng Việt cho logic nghiệp vụ

### Response format
```json
// Success
{ "success": true, "data": {}, "message": "..." }

// Error
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Naming conventions

**Database:**
- Bảng: `snake_case`, số nhiều (`users`, `bookings`)
- Cột: `snake_case` (`full_name`, `created_at`)
- PK: `id` (UUID)
- FK: `<singular>_id` (`customer_id`)
- Index: `idx_<table>_<column>`
- Constraint: `chk_<table>_<rule>`

**Backend:**
- File: `kebab-case.js`
- Biến/hàm: `camelCase`
- Class: `PascalCase`
- Hằng số: `UPPER_SNAKE_CASE`

**Frontend:**
- Component: `PascalCase.jsx`
- Hook: `useSomething.js`
- Folder: `kebab-case`

### Commit message
Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Scopes: `auth`, `booking`, `face`, `checkin`, `checkout`, `admin`, `db`, `ui`, `ai`

Ví dụ:
```
feat(auth): implement login API
- POST /api/auth/login
- Zod validation
- JWT token (7d expiry)
Refs: docs/03-backend/phase2-auth/README.md
```

## 🎯 Workflow khi nhận task

1. Đọc `CLAUDE.md` để nắm context
2. Đọc `00-CLAUDE-RULES.md` (file này)
3. Đọc file phase tương ứng
4. Đọc pattern reference (nếu có)
5. Implement theo spec
6. Test theo checklist ở cuối file phase
7. Update docs nếu thay đổi API

## 🧪 Testing
- Mỗi service function phải có ít nhất 1 test
- Test happy path + error cases
- Coverage: BE 70%, FE 60%, AI 80%