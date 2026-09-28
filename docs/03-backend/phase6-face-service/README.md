# Phase 6: Face Service

## Mục tiêu
Wrapper gọi AI Service + đăng ký khuôn mặt + upload Storage.

## Files cần tạo

```
src/services/
├── ai.service.js
└── storage.service.js

src/modules/face-profiles/
├── faces.controller.js
├── faces.service.js
├── faces.repository.js
├── faces.routes.js
└── faces.validation.js

src/middlewares/upload.middleware.js
```

## Chi tiết

### `services/ai.service.js`
Dùng axios instance với `baseURL = AI_SERVICE_URL`, header `X-API-Key`, timeout 15s.

Export:
- `embedFace(buffer, filename)` — POST `/embed` với FormData. Error mapping:
  - `FACE_NOT_DETECTED` → `BadRequestError('Không phát hiện khuôn mặt...')`
  - `FACE_LOW_QUALITY` → `BadRequestError('Khuôn mặt không đủ chất lượng...')`
  - ECONNREFUSED/TIMEOUT → `ServiceUnavailableError`
  - 500 → `InternalError`
- `compareFaces(emb1, emb2, threshold = 0.75)` — POST `/compare`
- `checkAIHealth()` — GET `/health`

### `services/storage.service.js`
Bucket `faces` (private).

Export:
- `uploadFaceImage(buffer, userId, mimeType)`:
  - Path: `{userId}/{Date.now()}.{ext}`
  - Upload với upsert false
  - Tạo signed URL (7 ngày) → return `{ path, url }`
- `deleteFaceImage(path)` — không throw, chỉ log
- `getSignedUrl(path, expiresIn = 3600)`

### `middlewares/upload.middleware.js`
Dùng multer memoryStorage.
- `uploadImage` = multer với limit 5MB, chỉ chấp nhận `image/jpeg`, `image/jpg`, `image/png`
- `.single('image')`

### Repository

`faces.repository.js`:
- `findActiveByCustomerId(customerId)` — WHERE customer_id + is_active = true
- `findAllByCustomerId(customerId)` — order by created_at desc
- `registerProfile({ customerId, faceImageUrl, faceEmbedding, modelVersion })` — **gọi RPC `register_face_profile`** để đảm bảo atomic (deactivate cũ + insert mới)

### Service

`faces.service.js`:

**`registerFace(userId, file)`:**
1. Validate: file tồn tại, size ≤ 5MB, mimeType trong [jpeg/jpg/png]
2. `findCustomerByUserId(userId)` → NotFound nếu null
3. Gọi `aiService.embedFace(file.buffer, file.originalname)` → embedding
4. Validate: `embedding.length === 512`
5. Upload lên Storage → `{ url }`
6. Gọi `facesRepo.registerProfile(...)` với RPC
7. Log
8. Return `{ id, face_image_url, model_version, is_active: true }`

**KHÔNG** trả embedding về client.

**`getMyFaceProfile(userId)`:**
- `findCustomerByUserId` → NotFound
- `findActiveByCustomerId` → NotFound('FaceProfile') nếu null
- Return

### Routes
```
POST /register  → authenticate + requireCustomer + uploadImage + register
GET  /me        → authenticate → getMe
```

Mount: `app.use('/api/faces', facesRoutes)`.

### PostgreSQL RPC cần tạo trước (chạy trong Supabase SQL Editor)
Function `register_face_profile(p_customer_id, p_face_image_url, p_face_embedding, p_model_version)`:
1. `UPDATE face_profiles SET is_active = FALSE WHERE customer_id = X AND is_active = TRUE`
2. `INSERT face_profiles (...) VALUES (...) RETURNING id`
3. Return new id
4. `SECURITY DEFINER`
5. Có EXCEPTION handler rollback

## Test
- Upload ảnh có mặt → 201
- Upload ảnh không có mặt → 400 FACE_NOT_DETECTED
- Upload file text → 400
- Upload ảnh > 5MB → 400
- Customer gọi /me không có profile → 404
- Customer gọi /me có profile → 200

## Điều kiện hoàn thành
- [ ] AI wrapper hoạt động
- [ ] Storage upload + signed URL
- [ ] RPC register atomic
- [ ] Partial unique index đảm bảo 1 profile active / customer
- [ ] KHÔNG trả embedding về FE

## Reference
- AI endpoints: `docs/02-system-design/ai-service/02-api-endpoints.md`
- Storage: `docs/02-system-design/backend/05-database-layer.md`