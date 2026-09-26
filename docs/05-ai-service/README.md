# AI Service

## Mục tiêu
Python FastAPI service nhận diện khuôn mặt: detect → embedding → compare.

## Tech Stack
- FastAPI + Uvicorn
- InsightFace `buffalo_l` (RetinaFace + ArcFace-R100)
- OpenCV headless
- NumPy

## Cấu trúc

```
app/
├── main.py                  ← FastAPI app + CORS + startup
├── api/
│   ├── deps.py              ← verify_api_key dependency
│   └── routes/
│       ├── health.py
│       ├── embed.py
│       └── compare.py
├── core/
│   ├── config.py            ← Pydantic Settings
│   └── logger.py
├── services/
│   ├── face_detection.py    ← RetinaFace, lazy load
│   ├── embedding.py          ← ArcFace, L2 normalize
│   └── similarity.py         ← Cosine + threshold
└── models/
    └── schemas.py           ← Pydantic request/response
```

## Endpoints

### `GET /health`
Trả `{ status: 'healthy', model_loaded: bool, version }`. Không require API key.

### `POST /embed`
- **Request:** multipart/form-data với field `image` (JPG/PNG, max 5MB)
- **Auth:** header `X-API-Key`
- **Logic:**
  1. Validate file type (JPG/PNG) và size (≤ 5MB)
  2. Decode bytes → numpy array (BGR) bằng OpenCV
  3. Detect faces bằng RetinaFace
  4. Nếu 0 face → 400 `FACE_NOT_DETECTED`
  5. Chọn face lớn nhất (max bbox area)
  6. Filter face ≥ 80x80 px → nếu fail → 400 `FACE_LOW_QUALITY`
  7. Lấy `face.embedding` (đã có sẵn từ InsightFace)
  8. L2 normalize
  9. Return `{ embedding: number[512], model_version, face_detected: true, bbox, confidence }`
- **KHÔNG log nội dung ảnh hoặc embedding**

### `POST /compare`
- **Request:** JSON `{ embedding1: number[512], embedding2: number[512], threshold?: number }`
- **Auth:** `X-API-Key`
- **Logic:**
  1. Validate cả 2 embedding có đúng 512 chiều
  2. Tính cosine similarity = dot(A, B) / (||A|| × ||B||)
  3. Clip về [-1, 1] để tránh floating point error
  4. `is_match = similarity >= threshold` (default 0.75)
  5. Return `{ similarity, is_match, threshold, distance: 1 - similarity }`

## Model loading

- **Lazy load:** Global `_app: FaceAnalysis | None = None`
- Hàm `get_face_app()` check nếu null thì khởi tạo `FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])`, gọi `prepare(ctx_id=0, det_size=(640, 640))`
- Cache sau lần đầu → request sau nhanh

## Config (`app/core/config.py`)

Dùng `pydantic_settings.BaseSettings`:
- `HOST='0.0.0.0'`, `PORT=8000`, `LOG_LEVEL='info'`
- `FACE_THRESHOLD=0.75`
- `MODEL_NAME='buffalo_l'`
- `API_KEY='dev-api-key'`
- Load từ `.env` với `@lru_cache`

## API Key dependency (`app/api/deps.py`)

`verify_api_key(x_api_key: str = Header(...))` — so sánh với `settings.API_KEY`. Fail → 401 `UNAUTHORIZED`.

## Middleware

- **CORS:** whitelist `http://localhost:5173`, `http://localhost:3000`, production frontend
- **Logging middleware:** Log mỗi request với duration (method, path, status, duration_ms). KHÔNG log ảnh/embedding.

## Startup

Trong `@app.on_event("startup")`:
- Log "Starting AI service..."
- Gọi `get_face_app()` để preload model (tránh cold request)
- Log "AI service ready"

## Response format

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": { "code": "FACE_NOT_DETECTED", "message": "..." } }
```

Error codes:
- `FACE_NOT_DETECTED` (400)
- `FACE_LOW_QUALITY` (400)
- `INVALID_IMAGE` (400)
- `INVALID_EMBEDDING` (400)
- `UNAUTHORIZED` (401)

## Performance targets

| Task | Target |
|------|--------|
| Embed 1 ảnh (CPU) | < 1s |
| Compare 2 vectors | < 10ms |
| Cold start (download model lần đầu) | 15-25s |
| Memory | < 2GB |

## Constraints quan trọng

- **Threshold = 0.75** (không đổi trừ khi có lý do)
- **Embedding 512 chiều** — nếu đổi model phải re-embed toàn bộ
- **L2 normalize** trước khi lưu/so sánh
- **KHÔNG so sánh** embedding từ 2 model version khác nhau
- **KHÔNG log** ảnh raw hoặc embedding (privacy)

## Dependencies (`requirements.txt`)

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
insightface==0.7.3
onnxruntime==1.16.0
opencv-python-headless==4.8.1.78
numpy==1.24.3
pillow==10.1.0
python-dotenv==1.0.0
pydantic-settings==2.1.0
```

## Test (Pytest)

- `test_health` — 200, model_loaded true
- `test_embed_no_auth` — 422 (missing header)
- `test_embed_invalid_key` — 401
- `test_embed_success` — 200, embedding length = 512
- `test_embed_no_face` — 400 FACE_NOT_DETECTED
- `test_embed_invalid_file_type` — 400
- `test_embed_file_too_large` — 400
- `test_compare_identical` — similarity ≈ 1.0, is_match true
- `test_compare_orthogonal` — similarity ≈ 0.0
- `test_compare_invalid_dimension` — 422

Fixtures cần chuẩn bị trong `tests/fixtures/sample_faces/`:
- `face_1.jpg`, `face_2.jpg` — ảnh có mặt rõ
- `landscape.jpg` — không có mặt
- `small_face.jpg` — mặt < 80px

## Điều kiện hoàn thành

- [ ] 3 endpoints hoạt động
- [ ] Model lazy load + preload khi startup
- [ ] Threshold 0.75
- [ ] L2 normalize embedding
- [ ] Error mapping đầy đủ
- [ ] Swagger UI hoạt động tại `/docs`
- [ ] Test pass ≥ 80% coverage
- [ ] Không log ảnh/embedding