# Feature: Check-in AI ⭐

## Mục tiêu
**Feature trung tâm của đồ án** — Lễ tân quét khuôn mặt khách, xác thực AI, check-in tự động.

## Actors
- Staff (thực hiện)
- AI Service
- Camera

## Preconditions
- Booking `status = 'confirmed'`
- Customer có `face_profile` active
- Chưa check-in
- Camera hoạt động

## Postconditions

**Success:**
- `status = 'checked_in'`
- `face_verification_status = 'verified'`
- `face_verified_at`, `face_match_score`, `actual_check_in_at` set
- `room.status = 'occupied'`

**Fail:**
- `face_verification_status = 'failed'`
- Booking vẫn `confirmed`
- Log attempt

## Business Rules
- **Threshold: cosine similarity ≥ 0.75**
- **Max 3 attempts** → chuyển `manual_review`
- Chỉ 1 khuôn mặt, ≥ 80x80 px
- **Log mọi attempt** (không log ảnh/embedding)
- Chỉ staff/admin

## Flows

```
Staff nhập mã booking
   ↓
Validate: tồn tại, status confirmed, có face_profile
   ↓
Hiển thị info khách
   ↓
Chụp ảnh → upload
   ↓
AI /embed → embedding mới
   ↓
AI /compare với embedding đã đăng ký
   ↓
similarity >= 0.75?
   ├─ Yes → UPDATE booking + room, log, toast success
   └─ No  → UPDATE face_status = 'failed', log, cho retry (max 3)
```

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | /api/checkin/:bookingId/verify | Staff |
| POST | /api/checkin/:bookingId/confirm | Staff |
| POST | /api/checkin/:bookingId/manual | Staff |

## Database
- `bookings` — UPDATE status, face fields
- `rooms` — UPDATE status
- `face_profiles` — SELECT embedding

## UI Components
- `features/checkin/pages/CheckinPage.tsx`
- `features/checkin/components/BookingSearch.tsx`
- `features/checkin/components/BookingInfoCard.tsx`
- `features/checkin/components/FaceVerifyCamera.tsx`
- `features/checkin/components/VerificationResult.tsx`
- `features/checkin/components/ManualCheckinForm.tsx`
- `features/checkin/hooks/useCheckin.ts` — attempt counter, verify logic

## Tests
- Unit: threshold 0.75, match/fail logic
- Integration: full flow với AI mock
- E2E: staff search + verify

## Edge Cases
| Case | Xử lý |
|------|-------|
| Ảnh không có mặt | 400 FACE_NOT_DETECTED |
| Similarity < 0.75 | 400 + retry |
| Retry 3 lần fail | Chuyển manual_review |
| Booking đã checked_in | 409 |
| Booking chưa confirmed | 409 |
| Customer chưa đăng ký mặt | 400 + gợi ý manual |
| AI service down | 503 |

## Security
- Manual checkin là **SECURITY EVENT** — log ở level warn
- Yêu cầu reason (min 10) + identity_number
- Không lưu ảnh raw
- Không trả embedding về FE

## Performance
- Thời gian xác thực < 3s
- Accuracy ≥ 95%
- False accept < 1%

## Related
- Face Registration (`04`)
- Booking (`03`)
- Checkout (`06`)