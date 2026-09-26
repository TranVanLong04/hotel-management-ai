# Phase 9: Reporting

## Mục tiêu
Báo cáo doanh thu, occupancy, dashboard admin.

## Files cần tạo

```
src/modules/reports/
├── reports.controller.js
├── reports.service.js
├── reports.repository.js
├── reports.routes.js
└── reports.validation.js
```

## Chi tiết

### Repository

Export các functions query Supabase hoặc gọi RPC:

- `getRoomStats()` — count rooms theo status (is_active = true). Return `{ total, available, reserved, occupied, cleaning, maintenance }`
- `getBookingStatsToday()` — count bookings created today theo status
- `getRevenueToday()` — SUM payments.amount WHERE status completed AND `paid_at::date = today`
- `getRevenueThisMonth()` — tương tự nhưng từ đầu tháng
- `getNewCustomersThisMonth()` — count customers WHERE `created_at >= first of month`
- `getRevenueReport(from, to)` — gọi RPC `report_revenue(p_from, p_to)`
- `getOccupancyReport(from, to)` — gọi RPC `report_occupancy(p_from, p_to)`
- `getBookingsByStatus()` — group by status, trả object

### Service

**`getDashboard()`** — dùng `Promise.all` cho 5 queries song song:
- `rooms`, `bookings_today`, `revenue_today`, `revenue_this_month`, `new_customers_this_month`
- Tính `occupancy_rate = round(occupied / total × 100, 2)`
- Return object với 5 fields + occupancy_rate

**`getRevenue(from, to, groupBy)`** — gọi repo, tính total, return `{ period, total_revenue, data }`

**`getOccupancy(from, to)`** — gọi repo, tính average, return `{ period, average_occupancy, data }`

**`getBookingStats()`** — trả object group by status

### Routes (tất cả `authenticate + requireAdmin`)
- GET /dashboard
- GET /revenue?from=&to=&group_by=
- GET /occupancy?from=&to=
- GET /bookings-by-status

### Validation

**`revenueReportSchema`:** query có from, to (YYYY-MM-DD), group_by enum day/week/month default day
**`occupancyReportSchema`:** query có from, to

### PostgreSQL Functions cần tạo trước (chạy SQL Editor)

**`report_revenue(p_from, p_to)`:**
- SELECT DATE(paid_at), SUM(amount - refunded_amount), COUNT(*)
- FROM payments
- WHERE status = 'completed' AND paid_at::DATE BETWEEN p_from AND p_to
- GROUP BY DATE(paid_at) ORDER BY report_date
- Return table

**`report_occupancy(p_from, p_to)`:**
- Dùng `generate_series(p_from, p_to, '1 day')` tạo tất cả ngày
- Mỗi ngày: count DISTINCT room_id trong bookings có status checked_in/checked_out VÀ `check_in_date <= d AND check_out_date > d`
- Tính occupancy_rate = `occupied / total × 100`
- Return table

## Test
- GET /dashboard → return số liệu đúng (mock data)
- GET /revenue?from=...&to=... → bar chart data
- GET /occupancy → line chart data
- Non-admin access → 403

## Điều kiện hoàn thành
- [ ] Dashboard 5 số liệu
- [ ] Revenue report theo ngày
- [ ] Occupancy report
- [ ] Bookings by status
- [ ] Chỉ admin
- [ ] RPC functions chạy đúng

## Reference
- Feature reporting: `docs/08-features/09-reporting.md`