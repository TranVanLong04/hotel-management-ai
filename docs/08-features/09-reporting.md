# Feature: Reporting

## Mục tiêu
Báo cáo doanh thu, occupancy, dashboard admin.

## Actors
- Admin (chỉ admin)

## Preconditions
- Có data trong hệ thống

## Postconditions
- Báo cáo chính xác theo khoảng ngày
- Export thành công

## Business Rules

**Dashboard:**
- Occupancy = `occupied / total × 100`
- Revenue today = SUM payments WHERE status completed AND paid_at::date = today
- Không tính refund vào revenue

**Revenue Report:**
- Group by day/week/month
- Chỉ payments `completed`
- Trừ `refunded_amount`

**Occupancy Report:**
- Mỗi ngày: đếm phòng có booking overlap
- Overlap: `check_in_date <= d AND check_out_date > d`

**Top Products:**
- Sort theo revenue
- Percent = revenue / max_revenue × 100

## Flows

**Dashboard:**
1. Admin vào `/admin/dashboard`
2. GET /api/reports/dashboard?period=7d
3. Backend dùng Promise.all cho 5 queries song song
4. Frontend render stats + charts

**Reports:**
1. Date range picker
2. GET /api/reports/revenue?from=&to=
3. BarChart + LineChart
4. Export CSV client-side

## API Endpoints (Admin only)

| Method | Path |
|--------|------|
| GET | /api/reports/dashboard |
| GET | /api/reports/revenue?from=&to=&group_by= |
| GET | /api/reports/occupancy?from=&to= |
| GET | /api/reports/bookings-by-status |

## Database
- `payments` — SUM amount
- `bookings` — COUNT by status
- `rooms` — COUNT by status
- `customers` — COUNT new
- RPC functions: `report_revenue`, `report_occupancy`

## UI Components
- `features/admin/pages/DashboardPage.tsx`
- `features/admin/pages/ReportPage.tsx`
- `features/admin/components/StatsCard.tsx`
- `features/admin/components/RevenueChart.tsx` (Recharts AreaChart)
- `features/admin/components/PeriodFilter.tsx`
- `features/report/components/DateRangePicker.tsx`
- `features/report/components/RevenueByDayChart.tsx` (BarChart)
- `features/report/components/OccupancyChart.tsx` (LineChart)

## Tests
- Unit: tính toán chính xác
- Integration: full flow với data mẫu

## Edge Cases
| Case | Xử lý |
|------|-------|
| Không có data | Array rỗng + total 0 |
| from > to | 400 |
| Chia 0 (total_rooms = 0) | NULLIF → occupancy = 0 |
| Payments có refund | Trừ refunded_amount |

## Performance
- Dashboard parallel queries < 1s
- Revenue report 1 năm < 2s
- Occupancy 1 năm < 2s

## Related
- Checkout (`06`)
- Invoice Payment (`08`)
- Booking (`03`)