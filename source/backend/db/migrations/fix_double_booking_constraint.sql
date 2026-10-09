-- =====================================================
-- Migration: Fix double booking + race condition
-- Ngày: 2026-10-09
-- Mục đích:
--   1. Backup và Cleanup đơn ảo pending/pending_payment (test data)
--   2. Mở rộng exclusion constraint cho pending_payment + pending
--   3. Tạo RPC create_booking_with_lock với advisory lock
-- =====================================================

-- =====================================================
-- Bước 1: Backup toàn bộ booking pending/pending_payment trước khi cleanup
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings_backup_20261009 AS
SELECT * FROM bookings WHERE status IN ('pending', 'pending_payment');

-- =====================================================
-- Bước 2: Cleanup đơn ảo (đã xác nhận toàn bộ là test data)
-- =====================================================
UPDATE bookings
SET 
  status = 'cancelled',
  note = CASE 
    WHEN note IS NULL OR note = '' THEN '[Cleanup] Hủy đơn test trước khi migration'
    ELSE note || ' | [Cleanup] Hủy đơn test trước khi migration'
  END,
  updated_at = NOW()
WHERE status IN ('pending', 'pending_payment');

-- =====================================================
-- Bước 3: Đảm bảo btree_gist extension & Xóa constraint cũ
-- =====================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

-- =====================================================
-- Bước 4: Tạo lại constraint mới bao gồm cả pending_payment + pending
-- =====================================================
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  room_id WITH =,
  daterange(check_in_date, check_out_date, '[)') WITH &&
)
WHERE (status IN ('pending_payment', 'pending', 'confirmed', 'checked_in'));

-- =====================================================
-- Bước 5: Tạo RPC create_booking_with_lock
-- =====================================================
CREATE OR REPLACE FUNCTION create_booking_with_lock(
  p_user_id UUID,
  p_room_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE,
  p_number_of_guests INT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_room RECORD;
  v_booking_code TEXT;
  v_seq INT;
  v_date_str TEXT;
  v_room_lock_key BIGINT;
  v_new_booking RECORD;
  v_result JSONB;
BEGIN
  -- 5.1 Tìm customer_id từ user_id (trích xuất an toàn từ JWT)
  SELECT id INTO v_customer_id
  FROM customers
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'CUSTOMER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- 5.2 Lock phân đoạn sinh booking_code (Global advisory lock cho sequence trong ngày)
  PERFORM pg_advisory_xact_lock(hashtext('booking_code_seq_lock'));

  -- 5.3 Lock theo phòng cụ thể (Room-level advisory lock)
  v_room_lock_key := ('x' || substr(md5(p_room_id::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_room_lock_key);

  -- 5.4 Kiểm tra thông tin phòng & loại phòng
  SELECT r.id, r.room_number, r.floor, r.status, r.is_active, rt.id AS room_type_id, rt.name AS room_type_name, rt.base_price, rt.max_guests
  INTO v_room
  FROM rooms r
  JOIN room_types rt ON r.room_type_id = rt.id
  WHERE r.id = p_room_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROOM_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_room.is_active THEN
    RAISE EXCEPTION 'ROOM_INACTIVE' USING ERRCODE = 'P0003';
  END IF;

  IF v_room.status = 'maintenance' THEN
    RAISE EXCEPTION 'ROOM_MAINTENANCE' USING ERRCODE = 'P0004';
  END IF;

  IF p_number_of_guests > v_room.max_guests THEN
    RAISE EXCEPTION 'GUESTS_EXCEED' USING ERRCODE = 'P0005';
  END IF;

  -- 5.5 Sinh booking_code nguyên tử trong ngày: BK + YYYYMMDD + 3 số sequence
  v_date_str := to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYYMMDD');
  
  -- Lấy sequence lớn nhất hiện có trong ngày + 1
  SELECT COALESCE(MAX(
    CAST(substring(booking_code FROM 11 FOR 3) AS INT)
  ), 0) + 1 INTO v_seq
  FROM bookings
  WHERE booking_code LIKE 'BK' || v_date_str || '%';

  v_booking_code := 'BK' || v_date_str || lpad(v_seq::text, 3, '0');

  -- 5.6 Thêm mới đơn đặt phòng (Exclusion constraint sẽ bắt lỗi 23P01 nếu trùng lịch)
  INSERT INTO bookings (
    customer_id,
    room_id,
    booking_code,
    check_in_date,
    check_out_date,
    number_of_guests,
    room_price,
    status,
    note
  ) VALUES (
    v_customer_id,
    p_room_id,
    v_booking_code,
    p_check_in_date,
    p_check_out_date,
    p_number_of_guests,
    v_room.base_price,
    'pending_payment',
    p_note
  )
  RETURNING * INTO v_new_booking;

  -- 5.7 Lấy đầy đủ thông tin JOIN để trả về response chuẩn
  SELECT jsonb_build_object(
    'id', v_new_booking.id,
    'booking_code', v_new_booking.booking_code,
    'customer_id', v_new_booking.customer_id,
    'room_id', v_new_booking.room_id,
    'check_in_date', v_new_booking.check_in_date,
    'check_out_date', v_new_booking.check_out_date,
    'number_of_guests', v_new_booking.number_of_guests,
    'number_of_nights', v_new_booking.number_of_nights,
    'room_price', v_new_booking.room_price,
    'room_subtotal', v_new_booking.room_subtotal,
    'status', v_new_booking.status,
    'face_verification_status', v_new_booking.face_verification_status,
    'note', v_new_booking.note,
    'created_at', v_new_booking.created_at,
    'updated_at', v_new_booking.updated_at,
    'customers', (
      SELECT jsonb_build_object(
        'id', c.id,
        'user_id', c.user_id,
        'full_name', c.full_name,
        'phone', c.phone,
        'identity_number', c.identity_number
      )
      FROM customers c
      WHERE c.id = v_new_booking.customer_id
    ),
    'rooms', (
      SELECT jsonb_build_object(
        'id', r.id,
        'room_number', r.room_number,
        'floor', r.floor,
        'room_types', jsonb_build_object(
          'id', rt.id,
          'name', rt.name,
          'base_price', rt.base_price,
          'max_guests', rt.max_guests
        )
      )
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = v_new_booking.room_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
