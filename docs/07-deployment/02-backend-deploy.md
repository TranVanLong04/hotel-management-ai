# Backend Deploy (Railway)

## Chuẩn bị

### `package.json`
- Thêm `"engines": { "node": ">=20.0.0" }`
- Script `"start": "node src/server.js"`

### Bind `0.0.0.0`
Trong `server.js`: `app.listen(PORT, '0.0.0.0')` — Railway yêu cầu.

### CORS production
Whitelist: `https://hotel-ai.vercel.app` và `https://hotel-ai-*.vercel.app`.

### `railway.json` (optional)
- Builder: NIXPACKS
- Start command: `pnpm start`
- Healthcheck: `/health`, timeout 100s
- Restart policy: ON_FAILURE, max 3 retries

## Deploy steps

1. Push code lên GitHub `main`
2. Vào [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Chọn repo
4. **Settings → Source:**
   - Root Directory: `source/backend`
   - Build: `pnpm install`
   - Start: `pnpm start`
5. **Variables:** copy từ `.env.example`, điền giá trị thật:
   - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   - JWT_SECRET (random 32+ chars)
   - AI_SERVICE_URL (update sau khi deploy AI)
   - AI_SERVICE_API_KEY
6. **Settings → Networking → Generate Domain**
7. Test: `curl https://backend-xxx.up.railway.app/health`

## Sau khi có domain
Update frontend env `VITE_API_URL`.

## Troubleshooting
| Lỗi | Fix |
|-----|-----|
| Cannot find module | Thêm deps vào package.json |
| Port in use | Dùng `process.env.PORT` |
| CORS blocked | Update whitelist |
| Build fail | Set `engines.node` |
| Healthcheck fail | Đảm bảo `/health` trả 200 |

## Xem logs
Railway → Deployments → Logs.

## Health check endpoint
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```