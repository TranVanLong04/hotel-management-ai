# Routing

## Library
React Router v6, lazy loading, protected routes.

## Paths constants — `routes/paths.js`

Tất cả path trong 1 object `PATHS`:
- Public: HOME, LOGIN, REGISTER, ROOMS, ROOM_DETAIL
- Customer: BOOKING, MY_BOOKINGS, MY_PROFILE, FACE_REGISTER
- Staff: STAFF_CHECKIN, STAFF_CHECKOUT, STAFF_BOOKINGS
- Admin: ADMIN_DASHBOARD, ADMIN_ROOMS, ADMIN_ROOM_TYPES, ADMIN_SERVICES, ADMIN_USERS, ADMIN_BOOKINGS, ADMIN_REPORTS
- Errors: FORBIDDEN, NOT_FOUND

## Router setup — `routes/index.jsx`

- Dùng `createBrowserRouter`
- Lazy load mọi page: `const X = lazy(() => import(...))`
- Wrap trong `<Suspense fallback={<Loading fullScreen />}>`
- Cấu trúc nested routes dưới `MainLayout` và `AdminLayout`

## Route guards

**`ProtectedRoute`** — Yêu cầu login:
```javascript
if (!user) return <Navigate to="/login" state={{ from: location }} />;
return children;
```

**`RoleRoute`** — Yêu cầu role cụ thể:
```javascript
if (!user) return <Navigate to="/login" />;
if (!roles.includes(user.role)) return <Navigate to="/403" />;
return children;
```

**`PublicRoute`** (optional) — Chỉ khi chưa login:
```javascript
if (user) return <Navigate to="/" />;
return children;
```

## Route matrix

| Route | Public | Customer | Staff | Admin |
|-------|:------:|:--------:|:-----:|:-----:|
| `/` `/login` `/rooms` | ✅ | ✅ | ✅ | ✅ |
| `/booking/:id` `/my-bookings` `/face-register` | ❌ | ✅ | ✅ | ✅ |
| `/staff/*` | ❌ | ❌ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ❌ | ✅ |

## Redirect sau login
Đọc `location.state.from` → navigate về đó:
```javascript
const from = location.state?.from?.pathname || '/';
navigate(from, { replace: true });
```

## Route order QUAN TRỌNG
Route cụ thể phải đặt trước dynamic:
```javascript
// ✅ Đúng
router.get('/available', ...)   // specific
router.get('/:id', ...)         // dynamic

// ❌ Sai
router.get('/:id', ...)         // match "available" as id
router.get('/available', ...)   // không bao giờ chạy
```

## Query params
```javascript
const [searchParams, setSearchParams] = useSearchParams();
const page = parseInt(searchParams.get('page')) || 1;
```

## 404 & 403
- `NotFoundPage` cho route không tồn tại
- `ForbiddenPage` cho sai role