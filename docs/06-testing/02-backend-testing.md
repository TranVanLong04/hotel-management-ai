# Backend Testing

## Setup
```bash
pnpm add -D jest supertest @types/jest
pnpm add -D @babel/preset-env babel-jest
```

## Config `jest.config.js`
- `testEnvironment: 'node'`
- `testMatch: ['**/tests/**/*.test.js']`
- Coverage threshold: branches 60, functions 70, lines 70
- `collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/**/*.routes.js']`

## Unit tests pattern

**Test service với mock repository:**
- `jest.mock()` các repository modules
- Setup mock return values trong `beforeEach`
- Test các case:
  - Happy path
  - Error cases (not found, conflict, validation)
  - Edge cases (guests exceed, price mismatch)

**Ví dụ cần test:**
- `auth.service`: register (email trùng), login (wrong password, disabled account)
- `bookings.service`: create (guests exceed, snapshot giá), cancel (wrong state)
- `checkin.service`: threshold 0.75, match/fail, attempt counter
- `checkout.service`: tính tiền, discount vượt total, payments < total

## Integration tests pattern

**Test API endpoint thật với DB test:**
- `beforeAll`: tạo test data (user, room, booking) qua Supabase
- `afterAll`: cleanup data đã tạo
- Dùng `supertest(app)` để gọi API
- Generate JWT token cho test user

**Cases cần test:**
- Auth: register, login, get /me với/không token
- Booking: create, list, confirm, cancel
- Checkin: verify với AI mock
- Checkout: full flow

## Test file structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── auth.service.test.js
│   │   ├── booking.service.test.js
│   │   └── checkin.service.test.js
│   └── utils/
│       └── format.test.js
├── integration/
│   ├── auth.test.js
│   ├── bookings.test.js
│   └── checkin.test.js
└── fixtures/
    ├── users.js
    └── rooms.js
```

## Best practices
- Mock external deps trong unit test (Supabase, AI service)
- Cleanup sau mỗi integration test
- Test cả happy path + error
- Tên test rõ: `should ... when ...`
- Không test private functions

## Commands
```bash
pnpm test
pnpm test -- --watch
pnpm test -- --coverage
```