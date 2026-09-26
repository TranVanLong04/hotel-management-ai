# Feature: Face Registration

## Mục tiêu
Khách đăng ký khuôn mặt qua webcam, lưu embedding 512D.

## Actors
- Customer
- AI Service (tạo embedding)
- Storage

## Preconditions
- Customer đã login
- Có camera
- Đã cấp quyền

## Postconditions
- Profile mới `is_active = TRUE`
- Profile cũ `is_active = FALSE`
- Ảnh lưu Storage
- 1 profile active / customer (partial unique index)

## Business Rules
- 1 customer = 1 profile active
- Embedding 512D từ ArcFace-R100
- Ảnh ≤ 5MB, JPG/PNG
- Mặt ≥ 80x80 px
- Chọn largest face nếu nhiều mặt
- KHÔNG lưu embedding raw text — dùng VECTOR type

## Flows

**Đăng ký:**
1. Vào `/face-register`
2. GET /api/faces/me → hiển thị profile cũ nếu có
3. Bấm "Bật camera" → getUserMedia
4. Chụp ảnh → preview
5. Confirm → POST /api/faces/register (multipart)
6. Backend: validate file → AI embed → upload Storage → deactivate cũ (RPC) → insert mới
7. Response 201 → toast + refetch

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | /api/faces/me | Customer |
| POST | /api/faces/register | Customer |

## Database
- `face_profiles` — INSERT, UPDATE (deactivate cũ), SELECT
- Partial unique index: `WHERE is_active = TRUE`
- RPC `register_face_profile` — atomic transaction

## UI Components
- `features/face/pages/FaceRegisterPage.tsx`
- `features/face/components/FaceCamera.tsx`
- `features/face/components/FacePreview.tsx`
- `features/face/hooks/useCamera.ts`

## Tests
- Unit: validate, deactivate
- Integration: AI mock + full flow
- E2E: camera flow

## Edge Cases
| Case | Xử lý |
|------|-------|
| Không có camera | Error + hướng dẫn |
| Từ chối quyền | Error message rõ |
| Ảnh > 5MB | 400 |
| Không phải ảnh | 400 |
| Không có mặt | 400 FACE_NOT_DETECTED |
| Nhiều mặt | Chọn largest, OK |
| Mặt < 80px | 400 FACE_LOW_QUALITY |

## Related
- Check-in AI (`05`) — dùng embedding