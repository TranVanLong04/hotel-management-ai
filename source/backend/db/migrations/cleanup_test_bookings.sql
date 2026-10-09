-- =====================================================
-- Migration: Cleanup test bookings
-- Ngày: 2026-10-09
-- Mục đích: Cleanup booking test cũ để tránh xung đột booking_code
-- =====================================================

-- Xóa booking test cũ bị kẹt
DELETE FROM bookings WHERE booking_code = 'BK20261009001';

-- Hoặc rộng hơn (chỉ xóa booking test nếu cần):
-- DELETE FROM bookings 
-- WHERE booking_code LIKE 'BK2026%' 
--   AND note LIKE '%Test%';
