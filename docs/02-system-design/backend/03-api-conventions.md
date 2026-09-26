# API Conventions

## Base URL
- Dev: `http://localhost:3000/api`
- Prod: `https://api.hotel-ai.com/api`

## HTTP Methods
- GET — Lấy data
- POST — Tạo mới
- PUT — Update toàn bộ
- PATCH — Update 1 phần
- DELETE — Xóa (soft)

## Status Codes
| Code | Khi nào |
|------|---------|
| 200 | GET/PUT/PATCH/DELETE OK |
| 201 | POST tạo mới |
| 204 | DELETE không trả body |
| 400 | Validation fail |
| 401 | Chưa login / token hết hạn |
| 403 | Không có quyền |
| 404 | Resource không tồn tại |
| 409 | Duplicate / overlap |
| 422 | Business logic fail |
| 500 | Server error |
| 503 | Service unavailable |

## Authentication
Header: `Authorization: Bearer <jwt>`

JWT payload:
```json
{
  "sub": "user-uuid",
  "email": "...",
  "role": "customer",
  "iat": 1700000000,
  "exp": 1700604800
}
```

Trong controller lấy `req.user.sub`.

## Pagination
Query: `?page=1&limit=20`
- Default: page=1, limit=20
- Max limit: 100

Response có `pagination` object.

## Filtering
Query params: `?status=confirmed&customer_id=uuid`
- Range: `?from=2026-01-01&to=2026-01-31`
- Search: `?search=text` (ilike)

## Sorting
Query: `?sort=created_at&order=desc`
- order: `asc` | `desc`

## Naming
- Endpoint: `kebab-case`, plural (`/room-types`)
- Query param: `snake_case`
- Body field: `snake_case`
- Response field: `snake_case`

## Endpoint pattern
```
GET    /api/<resource>            # List
GET    /api/<resource>/:id        # Detail
POST   /api/<resource>            # Create
PATCH  /api/<resource>/:id        # Update
DELETE /api/<resource>/:id        # Delete
POST   /api/<resource>/:id/<action>  # Action
```

## Response format
**Success:**
```json
{ "success": true, "data": {}, "message": "..." }
```

**Error:**
```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

**List:**
```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

## CORS
Whitelist:
- `http://localhost:5173` (dev)
- `https://hotel-ai.vercel.app` (prod)
- `https://hotel-ai-*.vercel.app` (preview)

## Rate limiting
- Anonymous: 60 req/phút/IP
- Authenticated: 300 req/phút/user