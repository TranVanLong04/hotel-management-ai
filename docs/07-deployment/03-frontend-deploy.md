# Frontend Deploy (Vercel)

## Chuẩn bị

### `vercel.json`
SPA rewrite — quan trọng để React Router hoạt động khi refresh:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Env production
`.env.production`:
```
VITE_API_URL=https://backend-xxx.up.railway.app/api
VITE_AI_URL=https://ai-service-xxx.up.railway.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Deploy steps

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Add New → Project
3. Chọn repo
4. **Configure:**
   - Framework: Vite
   - Root Directory: `source/frontend`
   - Build: `pnpm build`
   - Output: `dist`
   - Install: `pnpm install`
5. **Environment Variables:** thêm 4 biến VITE_* cho Production
6. Deploy → nhận URL
7. Custom domain (optional)

## Auto deploy
- Push `main` → auto deploy production
- Push `develop` → preview deploy (URL riêng)
- Push `feature/*` → preview deploy

Mỗi PR có preview URL để test trước khi merge.

## Troubleshooting
| Lỗi | Fix |
|-----|-----|
| 404 khi refresh | Thêm SPA rewrite |
| Failed to fetch | Whitelist domain FE ở BE CORS |
| VITE_XXX undefined | Prefix `VITE_` |
| Build timeout | Kiểm tra deps |

## Verify local
```bash
cd source/frontend
pnpm build
pnpm preview  # http://localhost:4173
```

## Analytics
Vercel Dashboard → Analytics tab: Web Analytics, Speed Insights, Runtime logs.