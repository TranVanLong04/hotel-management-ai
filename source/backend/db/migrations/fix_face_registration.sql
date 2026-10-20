-- ============================================================
-- Migration: fix_face_registration.sql
-- Ngày: 2026-10-20
-- Mục đích:
--   1. Thêm cột face_image_path (lưu path Storage thay vì signed URL)
--   2. Tạo RPC register_face_profile (atomic deactivate + insert)
-- ============================================================

-- 1. Thêm cột face_image_path để lưu đường dẫn nội bộ trong bucket
--    (signed URL sẽ được tạo mới mỗi lần GET /api/faces/me)
ALTER TABLE face_profiles
ADD COLUMN IF NOT EXISTS face_image_path TEXT;

-- 2. Tạo RPC atomic: deactivate tất cả profile cũ + insert profile mới
--    trong 1 transaction → đảm bảo partial unique index không bị vi phạm
CREATE OR REPLACE FUNCTION register_face_profile(
  p_customer_id UUID,
  p_face_image_url TEXT,
  p_face_image_path TEXT,
  p_face_embedding vector(512),
  p_model_version VARCHAR DEFAULT 'buffalo_l'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  -- Deactivate tất cả profile cũ của customer (nếu có)
  UPDATE face_profiles
  SET is_active = false, updated_at = NOW()
  WHERE customer_id = p_customer_id AND is_active = true;

  -- Insert profile mới (is_active = true)
  INSERT INTO face_profiles (
    customer_id, face_image_url, face_image_path,
    face_embedding, model_version, is_active
  )
  VALUES (
    p_customer_id, p_face_image_url, p_face_image_path,
    p_face_embedding, p_model_version, true
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- 3. Cấp quyền cho service_role (backend dùng supabaseAdmin)
GRANT EXECUTE ON FUNCTION register_face_profile TO service_role;
