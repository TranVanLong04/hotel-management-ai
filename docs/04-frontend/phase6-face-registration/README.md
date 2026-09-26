# Phase 6: Face Registration

## Mục tiêu
Khách đăng ký khuôn mặt qua webcam.

## Files cần tạo

```
src/api/face.api.ts
src/types/face.ts

src/features/face/
├── components/
│   ├── FaceCamera.tsx
│   ├── FacePreview.tsx
│   └── FaceStatusCard.tsx
├── hooks/
│   ├── useCamera.ts
│   └── useFaceProfile.ts
└── pages/
    └── FaceRegisterPage.tsx
```

## Chi tiết

### `useCamera.ts`
Custom hook quản lý webcam:
- Refs: `videoRef`, `canvasRef`, `streamRef`
- State: `isActive`, `isLoading`, `error`
- `start()` — gọi `navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }})`. Error mapping:
  - `NotAllowedError` → "Bạn cần cho phép truy cập camera"
  - `NotFoundError` → "Không tìm thấy camera"
  - `NotReadableError` → "Camera đang được sử dụng"
- `stop()` — stop tracks, clear srcObject
- `capture()` — return Promise `{ blob, dataURL }` từ canvas
- Cleanup khi unmount

### `face.api.ts`
- `getMyProfile()` — GET /faces/me
- `register(file)` — POST /faces/register với FormData

### `FaceRegisterPage.tsx`
Layout:
- Header icon + title + subtitle
- Nếu có profile → Card xanh hiển thị info cũ + ảnh thumbnail
- Nếu chưa → Alert vàng "Chưa đăng ký"
- Chuyển đổi giữa `<FaceCamera />` và `<FacePreview />`
- Note privacy bên dưới

State: `captured: { blob, dataURL } | null`, `submitting`

Flow:
1. Bấm "Bật camera" → `camera.start()`
2. Bấm "Chụp ảnh" → `camera.capture()` → lưu `captured` → `camera.stop()`
3. Chuyển sang `<FacePreview />`
4. Bấm "Chụp lại" → reset, mở lại camera
5. Bấm "Xác nhận" → tạo File từ blob → `faceApi.register(file)` → toast + refetch

### `FaceCamera.tsx`
Props: `{ videoRef, isActive, isLoading, error, onStart, onStop, onCapture }`

UI:
- Video với `transform: scaleX(-1)` (mirror)
- Overlay hướng dẫn: khung tròn trắng giữa
- Loading spinner khi `isLoading`
- Error overlay đỏ khi `error`
- Controls: nút "Bật/Tắt camera", "Chụp ảnh"
- Box hướng dẫn: nhìn thẳng, đủ sáng, không khẩu trang, giữ khuôn mặt trong khung

### `FacePreview.tsx`
- Image preview
- Nút "Chụp lại" + "Xác nhận"

### `FaceStatusCard.tsx`
- Hiển thị profile hiện tại nếu có: ảnh + model version + ngày cập nhật

## Test
- Bật camera OK
- Từ chối quyền camera → error message rõ
- Chụp → preview
- Chụp lại
- Xác nhận → upload → toast success
- Upload lỗi (không có mặt) → toast error

## Điều kiện hoàn thành
- [ ] Camera hook đầy đủ
- [ ] Flow chụp → preview → confirm
- [ ] Error handling cho mọi case
- [ ] Hiển thị profile cũ nếu có
- [ ] Dark mode
- [ ] Responsive