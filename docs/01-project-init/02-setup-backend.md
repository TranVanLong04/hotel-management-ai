# Setup Backend

## Yêu cầu
- Node.js 20 LTS
- pnpm: `npm install -g pnpm`

## Cài đặt

```bash
cd source/backend
pnpm init
pnpm add express cors helmet morgan dotenv
pnpm add @supabase/supabase-js
pnpm add jsonwebtoken bcryptjs
pnpm add zod
pnpm add pino pino-pretty
pnpm add multer
pnpm add axios form-data
pnpm add -D nodemon jest supertest
```

## Cấu trúc folder cần tạo

```
src/
├── config/          ← env, supabase, logger, constants
├── middlewares/     ← auth, role, error, validate, upload
├── modules/         ← domain modules
├── services/        ← shared services (ai, storage, mail)
├── utils/           ← response, errors, asyncHandler, pagination
├── app.js
└── server.js
tests/
```

## `package.json` scripts

Thêm:
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest"
  },
  "engines": { "node": ">=20.0.0" }
}
```

## Env

Copy `.env.example` → `.env`, điền:
- Supabase credentials (từ dashboard)
- JWT_SECRET (random 32+ chars)
- AI_SERVICE_URL

## Verify

```bash
pnpm dev
# → Server running on http://localhost:3000
```

## Reference
- Chi tiết architecture: `docs/02-system-design/backend/01-architecture.md`
- Folder structure: `docs/02-system-design/backend/02-folder-structure.md`