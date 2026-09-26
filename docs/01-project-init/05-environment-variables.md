# Environment Variables

## Backend (`source/backend/.env`)

| Biến | Bắt buộc | Mô tả |
|------|:--------:|-------|
| PORT | ✅ | 3000 |
| NODE_ENV | ✅ | development/production |
| SUPABASE_URL | ✅ | Từ Supabase Dashboard |
| SUPABASE_ANON_KEY | ✅ | Từ Supabase Dashboard |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | Từ Supabase Dashboard ⚠️ |
| JWT_SECRET | ✅ | Random 32+ chars |
| JWT_EXPIRES_IN | ✅ | 7d |
| BCRYPT_ROUNDS | ✅ | 10 |
| AI_SERVICE_URL | ✅ | http://localhost:8000 |
| AI_SERVICE_API_KEY | ✅ | Random |

⚠️ **`SUPABASE_SERVICE_ROLE_KEY` chỉ dùng ở backend. KHÔNG BAO GIỜ để lộ.**

## Frontend (`source/frontend/.env`)

Chỉ biến có prefix `VITE_` mới được expose:

- `VITE_API_URL` — URL backend
- `VITE_AI_URL` — URL AI Service
- `VITE_SUPABASE_URL` — URL Supabase
- `VITE_SUPABASE_ANON_KEY` — Anon key

**KHÔNG** đưa `SERVICE_ROLE_KEY` vào frontend.

## AI Service (`source/ai-service/.env`)

- `HOST`, `PORT` — Bind address
- `LOG_LEVEL` — info/debug
- `FACE_THRESHOLD` — 0.75
- `MODEL_NAME` — buffalo_l
- `API_KEY` — Key để backend gọi

## Lấy credentials từ Supabase
1. Vào Supabase Dashboard → Settings → API
2. Copy Project URL → `SUPABASE_URL`
3. Copy anon key → `SUPABASE_ANON_KEY` + `VITE_SUPABASE_ANON_KEY`
4. Copy service_role → `SUPABASE_SERVICE_ROLE_KEY`

## Bảo mật
- `.env` phải trong `.gitignore`
- Chỉ commit `.env.example`
- Rotate keys định kỳ
- Dùng secrets manager khi deploy production