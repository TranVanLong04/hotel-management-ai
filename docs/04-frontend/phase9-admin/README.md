# Phase 9: Admin Dashboard

## Yêu cầu chung

- **React + Vite + TypeScript** (strict, không `any`)
- **TailwindCSS** (dark mode class)
- **React Router DOM** v6
- **Lucide React** cho icons
- **Recharts** cho charts
- **Zustand** cho state
- **Axios** chuẩn bị cho REST API
- **KHÔNG dùng mock data** — gọi API thật
- **KHÔNG Bootstrap/Material UI**

## UI Requirements

- SaaS Admin Dashboard, sạch, tối giản
- **Light/Dark mode** toggle
- Responsive Desktop/Tablet/Mobile
- Layout: Sidebar + Header + Main Content
- Sidebar **collapse trên desktop**, **drawer trên mobile**
- Animation nhẹ (fade-in, slide-in, transition)
- Border radius 10-14px
- Tất cả button phải có chức năng — không trang trí

## Pages

- `/admin/dashboard`
- `/admin/bookings`
- `/admin/rooms`
- `/admin/room-types`
- `/admin/services`
- `/admin/users`
- `/admin/reports`
- `/admin/settings`

## Files cần tạo

```
src/
├── components/
│   ├── layout/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminHeader.tsx
│   │   └── ThemeToggle.tsx
│   ├── common/
│   │   ├── DataTable.tsx
│   │   ├── TableToolbar.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StatsCard.tsx
│   │   ├── Pagination.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── ActionsMenu.tsx
│   ├── dashboard/
│   │   ├── RevenueChart.tsx
│   │   ├── PeriodFilter.tsx
│   │   ├── RecentOrders.tsx
│   │   ├── TopProducts.tsx
│   │   ├── RoomStatusBreakdown.tsx
│   │   └── BookingStatusBreakdown.tsx
│   ├── rooms/
│   │   ├── RoomTable.tsx
│   │   ├── RoomForm.tsx
│   │   ├── RoomFilter.tsx
│   │   └── RoomStatusBadge.tsx
│   ├── room-types/
│   │   ├── RoomTypeCard.tsx
│   │   └── RoomTypeForm.tsx
│   ├── services/
│   │   ├── ServiceForm.tsx
│   │   └── ServiceTable.tsx
│   ├── bookings/
│   │   ├── BookingTable.tsx
│   │   ├── BookingStatusTabs.tsx
│   │   └── BookingDetailModal.tsx
│   ├── users/
│   │   ├── UserTable.tsx
│   │   ├── UserForm.tsx
│   │   ├── UserAvatar.tsx
│   │   └── RoleBadge.tsx
│   └── reports/
│       ├── RevenueByDayChart.tsx
│       ├── OccupancyChart.tsx
│       ├── DateRangePicker.tsx
│       └── ReportSummaryCards.tsx
├── pages/
│   └── admin/
│       ├── DashboardPage.tsx
│       ├── ManageBookingsPage.tsx
│       ├── ManageRoomsPage.tsx
│       ├── ManageRoomTypesPage.tsx
│       ├── ManageServicesPage.tsx
│       ├── ManageUsersPage.tsx
│       ├── ReportPage.tsx
│       └── SettingsPage.tsx
├── store/
│   ├── themeStore.ts        ← Dark mode
│   ├── authStore.ts         ← Reuse
│   └── sidebarStore.ts      ← Collapse state
├── hooks/
│   ├── useDebounce.ts
│   ├── useDataTable.ts      ← Generic sort/filter/pagination
│   └── useCrud.ts           ← Generic CRUD logic
├── types/
│   ├── api.ts
│   ├── models.ts
│   ├── table.ts
│   └── forms.ts
├── lib/
│   ├── axios.ts             ← Axios instance
│   ├── format.ts            ← formatCurrency, formatDate
│   └── errorHandler.ts
└── api/
    ├── dashboard.api.ts
    ├── room.api.ts
    ├── roomType.api.ts
    ├── service.api.ts
    ├── booking.api.ts
    ├── user.api.ts
    └── report.api.ts
```

## Chi tiết từng khu vực

### Layout

**AdminSidebar.tsx**
- Collapse toggle (icon ChevronLeft/Right) trên desktop
- Menu items filter theo role (admin/staff)
- Active state với bg-primary-50 + text-primary-700
- Tooltip khi collapsed
- Logout button cuối
- Mobile: overlay + drawer, đóng khi click ngoài hoặc ESC

**AdminHeader.tsx**
- Hamburger toggle cho mobile
- Page title (lấy từ route)
- Right side: `<ThemeToggle />` + notification bell (optional) + `<UserMenu />`

**ThemeToggle.tsx**
- Icon Sun/Moon toggle
- Persist trong `themeStore` (Zustand + persist)
- Apply class `dark` lên `<html>` khi toggle

### Common Components

**DataTable.tsx** — Generic, TypeScript generic `<T>`:
- Props: `{ columns: Column<T>[], data: T[], loading, sort, onSort, rowKey, emptyState }`
- Column type: `{ key, label, sortable?, width?, align?, render?: (row: T) => ReactNode }`
- Sort indicator (chevron up/down)
- Loading → spinner
- Empty → EmptyState

**TableToolbar.tsx**
- Search input với debounce 400ms
- Filter dropdowns (children prop)
- Reset filters button (chỉ show khi có filter active)
- Actions slot (VD: "Thêm mới" button)

**EmptyState.tsx**
- Props: `{ icon?, title, description?, action? }`
- Icon trong circle bg-gray-100, size 16 (w-16 h-16)

**StatsCard.tsx**
- Props: `{ title, value, icon: LucideIcon, color: 'primary'|'success'|'warning'|'info'|'danger', change?, changePeriod? }`
- Trend indicator: mũi tên lên/xuống + màu (emerald nếu tăng, rose nếu giảm)
- Icon bên phải trong box có màu bg-*-50 dark:bg-*-950/40

**Pagination.tsx**
- Props: `{ currentPage, totalPages, onPageChange }`
- Show first, last, current ±2 với ellipsis
- Chevron left/right disabled khi không có

**ConfirmDialog.tsx**
- Wrap Modal
- Props: `{ open, onClose, onConfirm, loading, title, message, confirmText, cancelText, variant }`

**ActionsMenu.tsx**
- Dropdown với MoreHorizontal icon
- Props: `{ actions: Array<{ label, icon, onClick, danger?, divider? }> }`
- Click outside + ESC đóng

### Dashboard

**DashboardPage.tsx**
- Layout:
  - Header row: title + PeriodFilter + Refresh button
  - Row 1: 4 StatsCard (Revenue, Orders, Customers, Products)
  - Row 2: RevenueChart (2/3 width) + TopProducts (1/3 width)
  - Row 3: RoomStatusBreakdown + BookingStatusBreakdown
  - Row 4: RecentOrders
- Fetch `dashboardApi.getStats({ period })` khi mount + khi period đổi
- Refresh button → refetch (có spinner)

**PeriodFilter.tsx**
- 4 options: 7 ngày / 30 ngày / 3 tháng / 12 tháng
- Props: `{ value: Period, onChange: (p: Period) => void }`
- Style: pill container bg-gray-100, active button bg-white shadow-sm

**RevenueChart.tsx**
- Recharts `AreaChart`
- Props: `{ data: RevenuePoint[], loading }`
- Gradient fill từ primary-500
- CustomTooltip hiển thị formatCurrency
- XAxis/YAxis custom format (K/M/B)
- Responsive: `ResponsiveContainer width="100%" height={320}`

**RecentOrders.tsx**
- Bảng 6 cột: Mã đơn, Khách, Phòng, Ngày, Tổng tiền, Trạng thái
- Props: `{ orders: Booking[], loading }`
- Header có link "Xem tất cả" → `/admin/bookings`

**TopProducts.tsx**
- Props: `{ products: TopRoomType[] }`
- Mỗi item: rank badge + name + revenue + progress bar
- Progress % = revenue / maxRevenue × 100

**RoomStatusBreakdown.tsx**
- Props: `{ data: RoomStats }`
- Stacked bar (5 màu) + legend với số + %
- Colors: available=emerald, reserved=sky, occupied=rose, cleaning=amber, maintenance=gray

**BookingStatusBreakdown.tsx**
- Props: `{ data: BookingStats }`
- Grid 2 cột với mỗi status card màu tương ứng

### Management Pages

**ManageRoomsPage.tsx**
- Header: title + count + "Thêm phòng" button
- TableToolbar với search
- RoomFilter: status, room_type_id, floor dropdowns
- DataTable với columns:
  - room_number (bold)
  - room_type.name
  - floor
  - base_price (formatCurrency)
  - status (RoomStatusBadge)
  - actions (ActionsMenu: Sửa, Xóa)
- Modal RoomForm (create/edit)
- ConfirmDialog khi xóa
- URL sync cho filters + pagination

**RoomForm.tsx**
- Modal form
- Fields: room_number, room_type_id (select), floor, description
- Zod validation
- Warning khi unsaved changes
- Submit → `roomApi.create/update` → toast

**ManageRoomTypesPage.tsx**
- **Grid view** (không dùng table vì có ảnh)
- Mỗi RoomTypeCard: ảnh aspect-video + name + description + max_guests + amenities chips + price + actions (hover show)
- Grid: 1-2-3 cột responsive

**ManageServicesPage.tsx**
- Table view
- Columns: name (với icon Package), price, unit, is_active badge, actions
- Toggle status từ ActionsMenu

**ManageUsersPage.tsx**
- Table view
- Columns: avatar + name + email, phone, role (RoleBadge), is_active badge, created_at, actions
- Filters: role, is_active
- Actions: Sửa, Khóa/Mở khóa (disabled nếu self), Xóa (disabled nếu self)
- UserForm: full_name, phone, role (disabled nếu self), email readonly

**ManageBookingsPage.tsx**
- Status tabs (pending/confirmed/checked_in/checked_out/cancelled/all)
- Search theo code
- Table columns: code, customer, room, dates, total, status, face_status, actions
- Actions: View (mở detail modal), Confirm (nếu pending), Cancel (nếu pending/confirmed)
- Confirm/Cancel với dialog

**ReportPage.tsx**
- DateRangePicker với presets
- ReportSummaryCards: Total revenue, Days, Avg occupancy, Total customers
- RevenueByDayChart (BarChart)
- OccupancyChart (LineChart)
- Export CSV button → generate file client-side

**SettingsPage.tsx**
- Tabs: General, Profile, Security, Notifications, Appearance
- Mỗi tab có form riêng
- Reuse UI components

### Store

**themeStore.ts**
- Zustand + persist
- `theme: 'light' | 'dark'`
- `toggleTheme()` — apply class lên `<html>`

**sidebarStore.ts**
- `collapsed: boolean`
- `toggleCollapsed()`
- Persist để nhớ trạng thái

**useDataTable.ts** (hook)
- Generic hook cho sort/filter/pagination
- Input: initial filters, fetch function
- Output: `{ data, pagination, loading, error, filters, updateFilter, clearFilters, refetch }`
- Sync filters với URL query params
- Debounce search

**useCrud.ts** (hook)
- Generic CRUD logic
- Input: `{ createFn, updateFn, deleteFn, refetch }`
- Output: `{ submitting, deleting, handleCreate, handleUpdate, handleDelete, showForm, editing, deleting, openCreate, openEdit, openDelete, closeForm }`

### API

Tất cả API files dùng `lib/axios.ts`. Định nghĩa types cho request/response dựa trên `docs/02-system-design/shared/02-data-models.md`.

### Types

- `models.ts` — User, Customer, Room, Booking, ... (dựa trên data-models.md)
- `api.ts` — ApiResponse, ApiError, PaginatedResponse, các request types
- `table.ts` — Column<T>, SortState, TableFilters
- `forms.ts` — Form data types cho create/update

### Không có Mock data

- KHÔNG có file `src/data/mock*.ts`
- Mọi fetch đều gọi API thật qua axios
- Nếu API chưa sẵn sàng → hiển thị empty state + error message từ server
- Loading state cho mỗi fetch

## Interactions phải hoạt động

- [x] Search (debounced 400ms)
- [x] Filter (dropdown)
- [x] Sort (click header)
- [x] Pagination
- [x] CRUD (create/edit/delete)
- [x] Modal với validation
- [x] Dropdown ActionsMenu
- [x] Tabs (booking status, settings)
- [x] Dark mode toggle
- [x] Sidebar collapse (desktop) + drawer (mobile)
- [x] Toast notification (react-hot-toast)
- [x] Form validation (zod + react-hook-form)
- [x] Confirm dialog trước xóa

## Code Quality

- TypeScript strict, không dùng `any`
- Props có type
- Reusable components (DataTable, useDataTable, useCrud)
- Không duplicate code
- Không có `console.log` / `console.error`
- Code dễ mở rộng để đổi sang API khác

## Test

- Tất cả pages render OK
- CRUD operation cho mỗi entity
- Filter/sort/pagination
- Dark mode toggle hoạt động toàn app
- Sidebar collapse/expand (desktop) + drawer (mobile)
- Toast hiển thị mọi action
- Validation form chặn submit không hợp lệ
- Responsive Desktop/Tablet/Mobile

## Điều kiện hoàn thành

- [ ] 8 admin pages hoạt động
- [ ] DataTable reusable + useDataTable hook
- [ ] CRUD đầy đủ cho Rooms/RoomTypes/Services/Users
- [ ] Bookings với status tabs + confirm/cancel
- [ ] Dashboard với Recharts + period filter
- [ ] Reports với date range + export CSV
- [ ] Settings 5 tabs
- [ ] Dark mode
- [ ] Responsive
- [ ] Không mock data — chỉ gọi API thật
- [ ] TypeScript strict không có `any`
- [ ] Không console error/warning