# Backend Folder Structure

```
source/backend/
├── src/
│   ├── config/                  # Cấu hình
│   │   ├── env.js               # Validate env vars
│   │   ├── supabase.js          # 2 clients
│   │   ├── logger.js            # Pino
│   │   └── constants.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── notFound.middleware.js
│   │   └── upload.middleware.js   # Multer
│   │
│   ├── modules/                 # Domain modules
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   ├── users/
│   │   ├── customers/
│   │   ├── room-types/
│   │   ├── rooms/
│   │   ├── bookings/
│   │   ├── face-profiles/
│   │   ├── checkin/
│   │   ├── checkout/
│   │   ├── services/
│   │   ├── service-usages/
│   │   ├── invoices/
│   │   └── reports/
│   │
│   ├── services/                # Shared services
│   │   ├── ai.service.js        # Wrapper gọi AI
│   │   └── storage.service.js   # Supabase Storage
│   │
│   ├── utils/
│   │   ├── response.js
│   │   ├── errors.js
│   │   ├── asyncHandler.js
│   │   ├── pagination.js
│   │   └── date.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## Naming
| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Controller | `<module>.controller.js` | `auth.controller.js` |
| Service | `<module>.service.js` | `auth.service.js` |
| Repository | `<module>.repository.js` | `auth.repository.js` |
| Routes | `<module>.routes.js` | `auth.routes.js` |
| Validation | `<module>.validation.js` | `auth.validation.js` |
| Middleware | `<name>.middleware.js` | `auth.middleware.js` |

## ES modules
- Dùng `import`/`export` — không CommonJS
- Luôn có `.js` extension khi import file local
- Không dùng `require()`