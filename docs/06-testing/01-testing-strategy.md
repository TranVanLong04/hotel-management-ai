# Testing Strategy

## Testing Pyramid
- 70% Unit tests
- 20% Integration tests
- 10% E2E tests

## Coverage targets
- Backend: ≥ 70%
- Frontend: ≥ 60%
- AI Service: ≥ 80%

## Tools
| Layer | Framework |
|-------|-----------|
| Backend | Jest + Supertest |
| Frontend | Vitest + Testing Library |
| AI | Pytest |
| E2E | Playwright |

## Khi nào viết test

**Bắt buộc:**
- Business logic quan trọng: booking overlap, price calculation, AI threshold
- Auth flow: register, login, JWT verify
- Payment/invoice: tính tiền chính xác
- Face verification: threshold 0.75

**Không cần:**
- Component UI đơn giản (Button, Badge)
- CRUD đơn giản (list, get by id)
- Config files

## Test structure

Backend:
```
tests/
├── unit/services/
├── integration/
└── fixtures/
```

Frontend:
```
src/__tests__/
├── components/
├── hooks/
└── features/
```

AI:
```
tests/
├── test_*.py
└── fixtures/sample_faces/
```

## CI/CD

GitHub Actions chạy test khi push lên `develop`/`main` và mỗi PR. Không merge nếu fail.