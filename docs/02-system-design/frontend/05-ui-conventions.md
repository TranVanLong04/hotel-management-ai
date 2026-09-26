# UI Conventions

## Colors (Tailwind config)
- Primary: blue
- Success: green/emerald
- Warning: amber/yellow
- Danger: rose/red
- Info: sky/cyan
- Gray scale: 50-950

## Spacing
- p-2 (8px) — compact
- p-4 (16px) — standard
- p-6 (24px) — card
- p-8 (32px) — page

## Typography
| Element | Classes |
|---------|---------|
| Page title | `text-2xl font-bold` |
| Section title | `text-lg font-semibold` |
| Body | `text-sm text-gray-700` |
| Small | `text-xs text-gray-500` |

## Border radius
- Buttons, inputs: `rounded-lg` (8px)
- Cards: `rounded-xl` (12px)
- Badges: `rounded-full` hoặc `rounded-md`

## Components patterns

**Button:**
- Variants: primary (blue), secondary (gray), outline, danger (red), ghost
- Sizes: sm, md, lg
- Loading: spinner + disabled
- Chỉ 1 primary trong 1 form

**Input:**
- Có label bên trên + required asterisk
- Border đỏ khi error
- Error message dưới field
- Focus: ring-2 ring-primary-500

**Card:**
- `bg-white dark:bg-gray-900 rounded-xl shadow-card border p-6`

**Badge:**
- Variants với màu theo enum (xem `04-enums.md`)
- `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs`

**Modal:**
- Overlay `bg-black/50`
- Max-width theo size (sm/md/lg/xl)
- Close bằng ESC + click outside
- Body overflow hidden khi mở

**Toast:**
- `react-hot-toast`
- Position: `top-right`
- Success/Error/Loading

**DataTable:**
- Generic với `columns` prop
- Sort indicator cho sortable columns
- Empty state khi không có data
- Responsive (overflow-x-auto)

**Pagination:**
- Show first, last, current ±2
- Chevron left/right
- Current page highlight primary

## Loading & Empty states
- **Loading:** Spinner hoặc Skeleton
- **Empty:** Icon + title + description + action button
- **Error:** Red card với message + retry button

## Responsive
| Prefix | Min-width | Device |
|--------|-----------|--------|
| (none) | 0 | Mobile |
| sm: | 640px | Mobile large |
| md: | 768px | Tablet |
| lg: | 1024px | Desktop |
| xl: | 1280px | Desktop large |

## Dark mode
- Dùng class `dark:` cho mọi color
- VD: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-gray-100`

## Accessibility
- `<label>` cho mọi input
- `aria-label` cho button chỉ có icon
- Focus visible: `focus:ring-2`
- Keyboard navigation cho modal/dropdown
- Alt text cho ảnh

## UX rules
- Feedback mọi action (loading, success, error)
- Confirm trước khi xóa (ConfirmDialog)
- Empty state có hướng dẫn
- Disable submit khi validating
- Scroll top khi đổi route