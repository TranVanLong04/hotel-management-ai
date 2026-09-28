-- =====================================================================
-- Phase 9: Reporting Stored Functions
-- Tham chiếu: docs/03-backend/phase9-reporting/README.md
-- Hướng dẫn: Mở Supabase Dashboard -> SQL Editor -> Dán và Chạy (Run) script này
-- =====================================================================

-- 1. Function report_revenue: Báo cáo doanh thu theo ngày
-- Tham số:
--   p_from: Ngày bắt đầu (DATE, YYYY-MM-DD)
--   p_to:   Ngày kết thúc (DATE, YYYY-MM-DD)
-- Trả về:
--   report_date: Ngày thanh toán
--   revenue: Tổng tiền thực thu (amount - refunded_amount)
--   payment_count: Số lượng giao dịch thành công trong ngày
CREATE OR REPLACE FUNCTION report_revenue(p_from DATE, p_to DATE)
RETURNS TABLE (
  report_date DATE,
  revenue NUMERIC,
  payment_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(p.paid_at) AS report_date,
    COALESCE(SUM(p.amount - COALESCE(p.refunded_amount, 0)), 0)::NUMERIC AS revenue,
    COUNT(*)::BIGINT AS payment_count
  FROM payments p
  WHERE p.status = 'completed'
    AND p.paid_at IS NOT NULL
    AND DATE(p.paid_at) BETWEEN p_from AND p_to
  GROUP BY DATE(p.paid_at)
  ORDER BY report_date ASC;
END;
$$;

-- 2. Function report_occupancy: Báo cáo công suất phòng theo ngày
-- Tham số:
--   p_from: Ngày bắt đầu (DATE, YYYY-MM-DD)
--   p_to:   Ngày kết thúc (DATE, YYYY-MM-DD)
-- Trả về:
--   report_date: Ngày báo cáo
--   total_rooms: Tổng số phòng đang hoạt động
--   occupied_rooms: Số phòng có khách ở (overlap: check_in <= d AND check_out > d)
--   occupancy_rate: Tỷ lệ lấp đầy (%)
CREATE OR REPLACE FUNCTION report_occupancy(p_from DATE, p_to DATE)
RETURNS TABLE (
  report_date DATE,
  total_rooms INT,
  occupied_rooms INT,
  occupancy_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_rooms INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_total_rooms
  FROM rooms
  WHERE is_active = TRUE;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_from, p_to, INTERVAL '1 day')::DATE AS d
  ),
  daily_occupancy AS (
    SELECT
      ds.d AS cur_date,
      COUNT(DISTINCT b.room_id)::INT AS occ_count
    FROM date_series ds
    LEFT JOIN bookings b
      ON b.status IN ('checked_in', 'checked_out')
      AND b.check_in_date <= ds.d
      AND b.check_out_date > ds.d
    GROUP BY ds.d
  )
  SELECT
    dc.cur_date AS report_date,
    COALESCE(v_total_rooms, 0) AS total_rooms,
    COALESCE(dc.occ_count, 0) AS occupied_rooms,
    CASE
      WHEN v_total_rooms > 0 THEN ROUND((dc.occ_count::NUMERIC / v_total_rooms::NUMERIC) * 100, 2)
      ELSE 0::NUMERIC
    END AS occupancy_rate
  FROM daily_occupancy dc
  ORDER BY dc.cur_date ASC;
END;
$$;