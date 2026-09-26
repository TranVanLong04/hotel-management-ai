# Deployment Overview

## Kiến trúc production
```
User Browser
    ↓ HTTPS
Frontend (Vercel) — hotel-ai.vercel.app
    ↓ REST + AI
Backend (Railway) — api.hotel-ai.com
AI Service (Railway Docker) — ai.hotel-ai.com
    ↓ SDK + HTTP
Supabase (Managed PostgreSQL)
```

## Platforms
| Service | Platform | Cost |
|---------|----------|------|
| Frontend | Vercel | Free |
| Backend | Railway | $5/tháng |
| AI Service | Railway (Docker) | $10-15/tháng |
| Database | Supabase | Free |
| **Tổng** | | **~$15-20/tháng** |

## Environments
| Env | Frontend | Backend | AI |
|-----|----------|---------|-----|
| Dev | localhost:5173 | localhost:3000 | localhost:8000 |
| Preview | vercel-preview-*.vercel.app | — | — |
| Prod | hotel-ai.vercel.app | api.hotel-ai.com | ai.hotel-ai.com |

## Deployment flow
1. Code trên `feature/*`
2. Merge → `develop`
3. Test trên develop
4. Merge → `main`
5. Vercel/Railway auto deploy
6. Smoke test production

## Checklist trước deploy
- [ ] Tất cả test pass local
- [ ] `.env.example` đã update
- [ ] Không có secret bị commit
- [ ] Build thành công local
- [ ] AI Service chạy local ổn

## Checklist sau deploy
- [ ] Smoke test: login, booking, check-in
- [ ] CORS cho domain production
- [ ] Env vars đã set đủ
- [ ] Test error cases (401, 403, 404)
- [ ] Monitor logs 24h đầu