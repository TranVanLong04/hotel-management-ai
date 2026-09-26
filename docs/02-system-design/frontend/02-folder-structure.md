# Frontend Folder Structure

```
src/
├── api/                    # HTTP clients
│   ├── axios.js            # Instance + interceptors
│   ├── auth.api.js
│   ├── booking.api.js
│   ├── room.api.js
│   ├── roomType.api.js
│   ├── face.api.js
│   ├── checkin.api.js
│   ├── checkout.api.js
│   ├── service.api.js
│   ├── invoice.api.js
│   ├── user.api.js
│   └── report.api.js
│
├── components/
│   ├── ui/                 # Button, Input, Select, Modal, Badge, Card, Pagination
│   ├── layout/             # Header, AdminSidebar, Footer, UserMenu
│   ├── feedback/           # Loading, Empty, ErrorBoundary, ConfirmDialog
│   └── common/             # DataTable, TableToolbar, EmptyState, StatsCard
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── room/
│   ├── booking/
│   ├── face/
│   ├── checkin/
│   ├── checkout/
│   ├── admin/
│   ├── report/
│   └── profile/
│
├── hooks/                  # useAuth, useDebounce, useTheme, useCamera
├── layouts/                # MainLayout, AdminLayout
├── pages/                  # HomePage, NotFoundPage, ForbiddenPage
├── routes/                 # index.jsx, paths.js, ProtectedRoute, RoleRoute
├── stores/                 # authStore, bookingStore, uiStore
├── utils/                  # format, validators, constants, errorHandler
└── data/                   # mockDashboard.js
```

## Naming
| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | PascalCase.jsx | `BookingForm.jsx` |
| Hook | usePascalCase.js | `useAuth.js` |
| Util | camelCase.js | `formatCurrency.js` |
| Store | camelCaseStore.js | `authStore.js` |
| API | camelCase.api.js | `booking.api.js` |
| Folder | kebab-case | `booking-form/` |

## Aliases
```
@         → src
@api      → src/api
@components → src/components
@features → src/features
@hooks    → src/hooks
@layouts  → src/layouts
@pages    → src/pages
@routes   → src/routes
@stores   → src/stores
@utils    → src/utils
```

## Feature folder pattern
```
features/booking/
├── components/
│   ├── BookingForm.jsx
│   ├── BookingCard.jsx
│   └── BookingStatusTabs.jsx
├── hooks/
│   ├── useCreateBooking.js
│   └── useMyBookings.js
└── pages/
    ├── BookingPage.jsx
    └── MyBookingsPage.jsx
```