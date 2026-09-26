# Monitoring & Maintenance

## Tools
| Service | Tool | Cost |
|---------|------|------|
| Uptime | UptimeRobot | Free |
| Error | Sentry | Free 5k events |
| Logs | Railway built-in | Free |
| Analytics | Vercel | Free |
| DB | Supabase Dashboard | Free |

## UptimeRobot
Tạo 3 monitors ping mỗi 5 phút:
- `https://backend-xxx.railway.app/health`
- `https://hotel-ai.vercel.app`
- `https://ai-xxx.railway.app/health`

Alert email khi down > 5 phút.

## Sentry — Backend
- `pnpm add @sentry/node`
- Init trong `server.js` nếu `NODE_ENV === 'production'`
- `tracesSampleRate: 0.1` (10% sampling)
- Thêm `Sentry.Handlers.errorHandler()` sau tất cả routes

## Sentry — Frontend
- `pnpm add @sentry/react`
- Init trong `main.tsx` nếu production
- Wrap app với `Sentry.ErrorBoundary`

## Logging

**Backend:**
- Structured logs (pino JSON)
- Log mọi request với duration
- Redact: password, password_hash, token
- Railway tự capture stdout

**AI Service:**
- Middleware log mỗi request: method, path, status, duration
- KHÔNG log ảnh/embedding

**Frontend:**
- Console.log chỉ trong dev
- Không console trong production build

## Alert rules

**Critical (email ngay):**
- Backend down > 5 phút
- Error rate > 5%
- DB connection error
- AI timeout > 10%

**Warning (xem hàng ngày):**
- CPU > 80% (10 phút)
- RAM > 90%
- Slow queries > 1s

## Performance metrics

**Frontend Core Web Vitals:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

**Backend:** Log duration mọi request.

## Maintenance tasks

**Daily:**
- Check UptimeRobot
- Check Sentry errors
- Review Railway logs

**Weekly:**
- Review performance
- Check DB size
- Update deps (security patches)

**Monthly:**
- Rotate secrets (JWT_SECRET, API_KEY)
- Backup database
- Review costs
- Update docs

## Backup

**Database:**
- Supabase auto daily backup (free: 7 ngày)
- Manual: `pg_dump` định kỳ

**Storage:**
- Supabase Dashboard → Storage → Download

**Code:**
- Đã có Git, `main` là production