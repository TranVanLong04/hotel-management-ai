# AI Service Testing

## Setup
```bash
pip install pytest pytest-cov pytest-asyncio httpx
```

## Config `pytest.ini`
- `testpaths = tests`
- `addopts = -v --cov=app --cov-report=html --cov-report=term-missing`

## Test cases

### Face detection (`test_face_detection.py`)
- `test_decode_valid_image` — decode JPG → numpy BGR array
- `test_decode_invalid_image` — bytes không phải ảnh → ValueError
- `test_detect_single_face` — ảnh 1 mặt → return ≥ 1 face
- `test_detect_no_face` — ảnh phong cảnh → return []
- `test_get_largest_face` — nhiều mặt → return mặt lớn nhất
- `test_filter_valid_faces` — filter face < 80px

### Embedding (`test_embedding.py`)
- `test_embedding_shape` — shape (512,)
- `test_embedding_normalized` — norm ≈ 1.0
- `test_embedding_no_face` — ảnh không có mặt → return None
- `test_normalize_zero_vector` — normalize vector zero → ValueError
- `test_model_version_constant` — `MODEL_VERSION == 'arcface-r100-v1'`

### Similarity (`test_similarity.py`)
- `test_identical_vectors` — similarity ≈ 1.0
- `test_orthogonal_vectors` — similarity ≈ 0.0
- `test_opposite_vectors` — similarity ≈ -1.0
- `test_shape_mismatch` — 512 vs 256 → ValueError
- `test_compare_faces_match` — vector giống → is_match true
- `test_compare_faces_no_match` — vector random → is_match false
- `test_find_best_match` — query = candidate[0] → idx = 0

### API (`test_api.py`)
- `test_health` — 200, model_loaded
- `test_embed_without_api_key` — 422
- `test_embed_with_invalid_api_key` — 401
- `test_embed_success` — 200, embedding len 512
- `test_embed_no_face` — 400 FACE_NOT_DETECTED
- `test_embed_invalid_file_type` — 400
- `test_embed_file_too_large` — 400 (> 5MB)
- `test_compare_success` — 200, similarity ≈ 1
- `test_compare_invalid_dimension` — 422

## Fixtures cần chuẩn bị

`tests/fixtures/sample_faces/`:
- `face_1.jpg` — 1 mặt rõ (200x200+)
- `face_2.jpg` — mặt khác
- `group_photo.jpg` — nhiều mặt
- `landscape.jpg` — không có mặt
- `small_face.jpg` — mặt < 80px
- `blurred_face.jpg` — mặt mờ

**Lưu ý:** Dùng ảnh public domain (Unsplash, Pexels), không dùng ảnh cá nhân thật.

## Coverage target
≥ 80%

## Commands
```bash
pytest
pytest --cov=app
pytest -v tests/test_api.py
```