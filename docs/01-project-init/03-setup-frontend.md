# Setup Frontend

## Cài đặt

```bash
cd source/frontend
pnpm create vite . --template react
pnpm install
pnpm add react-router-dom axios zustand
pnpm add react-hot-toast dayjs lucide-react
pnpm add react-hook-form zod @hookform/resolvers
pnpm add recharts
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```

## Tailwind config

`tailwind.config.js`:
- Content: `./index.html`, `./src/**/*.{js,jsx}`
- Dark mode: `'class'`
- Extend colors: primary (blue), success (green), warning (yellow), danger (red), info (cyan)
- Font: Inter

`src/index.css`:
- Import Tailwind directives
- Base styles cho body (bg-gray-50, text-gray-900)
- Dark mode variants

## Alias imports — `vite.config.js`

```javascript
resolve: {
  alias: {
    '@': path.resolve('./src'),
    '@api': path.resolve('./src/api'),
    '@components': path.resolve('./src/components'),
    '@features': path.resolve('./src/features'),
    '@hooks': path.resolve('./src/hooks'),
    '@layouts': path.resolve('./src/layouts'),
    '@pages': path.resolve('./src/pages'),
    '@routes': path.resolve('./src/routes'),
    '@stores': path.resolve('./src/stores'),
    '@utils': path.resolve('./src/utils'),
  }
}
```

## Cấu trúc folder

```
src/
├── api/          ← axios + api clients
├── components/   ← shared UI (ui, layout, feedback, common)
├── features/     ← domain features
├── hooks/        ← global hooks
├── layouts/      ← page layouts
├── pages/        ← route pages
├── routes/       ← routing config
├── stores/       ← Zustand
├── utils/        ← helpers
├── data/         ← mock data
├── App.jsx
├── main.jsx
└── index.css
```

## Env

`.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_AI_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Verify
```bash
pnpm dev  # → http://localhost:5173
```

## Reference
- Frontend architecture: `docs/02-system-design/frontend/01-architecture.md`
- UI conventions: `docs/02-system-design/frontend/05-ui-conventions.md`