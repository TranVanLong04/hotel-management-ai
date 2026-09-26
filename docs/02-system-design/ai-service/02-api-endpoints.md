# AI Service API Endpoints

## Base URL
- Dev: `http://localhost:8000`
- Prod: `https://ai.hotel-ai.com`

## Auth
Header `X-API-Key: <key>` cho mọi endpoint (trừ `/health`).

## GET /health
Response 200:
```json
{ "status": "healthy", "model_loaded": true, "version": "1.0.0" }
```

## POST /embed

**Request:** `multipart/form-data`
- Field `image`: File (JPG/PNG, max 5MB)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "embedding": [0.123, -0.456, ...],   // 512 floats, L2-normalized
    "model_version": "arcface-r100-v1",
    "face_detected": true,
    "bbox": { "x": 120, "y": 80, "width": 200, "height": 240 },
    "confidence": 0.98
  }
}
```

**Response 400 — Không phát hiện mặt:**
```json
{
  "success": false,
  "error": { "code": "FACE_NOT_DETECTED", "message": "Không tìm thấy khuôn mặt" }
}
```

**Response 400 — Ảnh không hợp lệ:**
```json
{
  "success": false,
  "error": { "code": "INVALID_IMAGE", "message": "File không phải ảnh hợp lệ" }
}
```

**Response 401 — Sai API key:**
```json
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "API key không hợp lệ" }
}
```

## POST /compare

**Request:**
```json
{
  "embedding1": [0.123, -0.456, ...],   // 512 floats
  "embedding2": [0.789, -0.012, ...],   // 512 floats
  "threshold": 0.75
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "similarity": 0.87,
    "is_match": true,
    "threshold": 0.75,
    "distance": 0.13
  }
}
```

**Response 400 — Sai số chiều:**
```json
{
  "success": false,
  "error": { "code": "INVALID_EMBEDDING", "message": "Embedding phải có 512 chiều" }
}
```

## Backend integration

**`ai.service.js`** wraps HTTP calls:
- `embedFace(buffer, filename)` — POST multipart
- `compareFaces(emb1, emb2, threshold)` — POST JSON
- `checkAIHealth()` — GET health

Error mapping:
- FACE_NOT_DETECTED → BadRequestError
- ECONNREFUSED/timeout → ServiceUnavailableError
- 500 → InternalError

## Constraints
- Ảnh max 5MB
- File types: JPG, PNG
- Embedding phải đúng 512 chiều
- Threshold trong [0, 1]