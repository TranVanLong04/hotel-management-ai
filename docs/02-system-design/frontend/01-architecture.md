# Frontend Architecture

## Kiến trúc: Feature-based (không phải Type-based)

```
src/
├── api/                # HTTP calls
├── components/         # Shared UI (dumb)
│   ├── ui/             # Button, Input, Modal...
│   ├── layout/         # Header, Sidebar
│   ├── feedback/       # Loading, Empty, Error
│   └── common/         # DataTable, TableToolbar, EmptyState
├── features/           # Domain features (smart)
│   ├── auth/
│   ├── booking/
│   ├── face/
│   └── ...
├── hooks/              # Global hooks
├── layouts/            # Page layouts
├── pages/              # Route pages
├── routes/             # Routing config
├── stores/             # Zustand
├── utils/              # Helpers
└── data/               # Mock data
```

## 4 loại component

1. **UI components (dumb)** — Button, Input, Modal. Không logic, nhận props render.
2. **Feature components (smart)** — BookingForm, RoomCard. Có business logic, gọi API/hooks.
3. **Page components** — Entry point của route. Compose features + layouts.
4. **Layout components** — Header, Sidebar. Wrap nhiều page.

## Data flow
```
User action → Component → Hook → API (axios) → Backend
                              ↓
                         Update store/state
                              ↓
                         Re-render UI
```

## State types
| Loại | Nơi lưu |
|------|---------|
| UI state (modal open) | `useState` |
| Form state | `react-hook-form` |
| Server state (fetched) | `useState` + custom hook |
| Global state (auth, cart) | Zustand |
| URL state (filter, page) | `useSearchParams` |

## Axios instance
- Base URL từ env
- Request interceptor: gắn `Authorization: Bearer <token>` từ authStore
- Response interceptor: return `response.data`, handle 401 → logout + redirect

## Styling
- TailwindCSS utility-first
- Không viết CSS riêng
- Component classes qua `@apply` cho repeated styles
- Dark mode: `darkMode: 'class'`

## Routing
- React Router v6
- Lazy loading cho pages
- ProtectedRoute + RoleRoute guards
- Route paths constants trong `routes/paths.js`

## Best practices
- 1 component = 1 file, file name = component name
- Props destructuring
- Custom hooks cho logic tái sử dụng
- Error boundary cho page
- Loading + error states mọi API call
- Không props drilling > 3 levels