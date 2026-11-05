-- =====================================================================
-- Migration: create_ai_comparisons.sql
-- Mục đích: Bảng lưu trữ lịch sử so sánh hiệu năng song song FaceNet & InsightFace
-- Hướng dẫn: Mở Supabase Dashboard -> SQL Editor -> Dán và Chạy (Run) script này
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(64) NOT NULL,
  dataset_tag VARCHAR(50) DEFAULT 'manual', -- 'album', 'customer_profiles', 'manual_upload', 'benchmark'
  ground_truth VARCHAR(20) DEFAULT 'unknown', -- 'genuine', 'impostor', 'unknown'
  reference_image_url TEXT,
  test_image_url TEXT,
  reference_name VARCHAR(100),
  test_name VARCHAR(100),

  -- Kết quả FaceNet
  facenet_model VARCHAR(64) DEFAULT 'FaceNet (Inception-ResNet-v1)',
  facenet_checkpoint VARCHAR(64) DEFAULT 'InceptionResnetV1_vggface2',
  facenet_similarity NUMERIC(6, 4) NOT NULL,
  facenet_threshold NUMERIC(6, 4) DEFAULT 0.7000,
  facenet_is_match BOOLEAN NOT NULL,
  facenet_inference_time_ms NUMERIC(8, 2) NOT NULL,
  facenet_total_time_ms NUMERIC(8, 2) NOT NULL,

  -- Kết quả InsightFace
  insightface_model VARCHAR(64) DEFAULT 'InsightFace (ArcFace buffalo_l)',
  insightface_checkpoint VARCHAR(64) DEFAULT 'w600k_r50_arcface',
  insightface_similarity NUMERIC(6, 4) NOT NULL,
  insightface_threshold NUMERIC(6, 4) DEFAULT 0.7500,
  insightface_is_match BOOLEAN NOT NULL,
  insightface_inference_time_ms NUMERIC(8, 2) NOT NULL,
  insightface_total_time_ms NUMERIC(8, 2) NOT NULL,

  -- Phân tích so sánh & chênh lệch
  is_agreement BOOLEAN NOT NULL,
  discrepancy_type VARCHAR(50), -- null, 'facenet_only_match', 'insightface_only_match'
  delta_similarity NUMERIC(6, 4) NOT NULL,
  latency_difference_ms NUMERIC(8, 2) NOT NULL,

  -- Bounding box & metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes tối ưu hóa truy vấn lọc và báo cáo thống kê
CREATE INDEX IF NOT EXISTS idx_ai_comparisons_created_at ON ai_comparisons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_comparisons_ground_truth ON ai_comparisons(ground_truth);
CREATE INDEX IF NOT EXISTS idx_ai_comparisons_dataset_tag ON ai_comparisons(dataset_tag);
CREATE INDEX IF NOT EXISTS idx_ai_comparisons_is_agreement ON ai_comparisons(is_agreement);
