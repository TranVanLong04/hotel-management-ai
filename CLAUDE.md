# CLAUDE.md — Tổng quan dự án

## Dự án là gì?
Website quản lý khách sạn tích hợp AI nhận diện khuôn mặt.
Đồ án tốt nghiệp — ĐH Kiến trúc Đà Nẵng.
Sinh viên: Trần Văn Long — 2251220175 — 22CT4
GVHD: ThS. Nguyễn Năng Hùng Vân

## Tech stack
- **Frontend:** React 18 + Vite + TailwindCSS + Zustand + React Router 6
- **Backend:** Node.js 20 + Express 4 + JWT + bcrypt + Zod
- **AI Service:** Python 3.10 + FastAPI + InsightFace + OpenCV
- **Database:** Supabase (PostgreSQL + pgvector) — ĐÃ CÓ SẴN
- **Package Manager:** pnpm (KHÔNG dùng npm/yarn)

## Cấu trúc
```
source/
├── backend/       ← Node.js + Express
├── frontend/      ← React + Vite
└── ai-service/    ← Python FastAPI
```

## Database (10 bảng — đã tồn tại trên Supabase)
users, customers, face_profiles, room_types, rooms,
bookings, services, service_usages, invoices, payments

**KHÔNG cần chạy SQL** — chỉ cần lấy credentials từ Supabase Dashboard.

## Ràng buộc KHÔNG được vi phạm
1. Dùng **pnpm**, KHÔNG dùng npm/yarn
2. KHÔNG đưa `SUPABASE_SERVICE_ROLE_KEY` vào frontend
3. Dùng TIMESTAMPTZ (không dùng TIMESTAMP)
4. Dùng NUMERIC cho tiền (không dùng FLOAT)
5. Validate ở 3 tầng: FE + BE + DB
6. Soft delete — dùng `is_active = FALSE`, KHÔNG xóa cứng
7. KHÔNG lưu ảnh vào DB — chỉ lưu URL từ Storage
8. Snapshot giá tại thời điểm dùng (room_price, unit_price, tax_rate)

## Git workflow
- `main` — production, KHÔNG code trực tiếp
- `develop` — integration
- `feature/*` — nơi làm việc
- Quy trình: tạo nhánh → checkpoint → nhờ AI → review git diff → commit/revert
- Chi tiết: `docs/01-project-init/01-git-workflow.md`

## Cách dùng docs
Khi nhận task, đọc theo thứ tự:
1. `CLAUDE.md` (file này)
2. `docs/00-CLAUDE-RULES.md` — quy tắc code
3. File phase tương ứng (VD: `docs/03-backend/phase2-auth/README.md`)
4. Pattern reference trong `docs/02-system-design/`

## Khi code
- Đọc spec trong docs trước khi viết
- Tuân thủ quy tắc trong `00-CLAUDE-RULES.md`
- Response format chuẩn: `{ success, data, message }` hoặc `{ success, error: { code, message } }`
- Naming: camelCase (JS), snake_case (DB), PascalCase (React components)