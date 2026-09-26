# Git Workflow

## Cấu trúc nhánh
```
main (production)
  ↑ merge khi test ổn
develop (integration)
  ↑ merge khi feature xong
feature/* (nơi làm việc)
```

| Nhánh | Mục đích | Ai push? |
|-------|----------|----------|
| main | Production | ✗ Không ai |
| develop | Integration | ✗ Không push trực tiếp |
| feature/* | Feature | ✅ Dev |
| fix/* | Fix bug | ✅ Dev |

## Đặt tên nhánh
Format: `<type>/<scope>-<description>`

Ví dụ:
- `feature/backend-auth-login`
- `feature/frontend-booking-form`
- `fix/ai-embed-timeout`

## Quy trình 5 bước với AI

### Bước 1: Tạo nhánh
```bash
git checkout develop
git pull
git checkout -b feature/backend-auth-login
```

### Bước 2: Checkpoint trước khi nhờ AI
```bash
git add .
git commit -m "checkpoint: before auth implementation"
```

Mục đích: Nếu AI code hỏng → `git restore .` quay lại.

### Bước 3: Nhờ AI code
Prompt mẫu:
```
Đọc CLAUDE.md, docs/00-CLAUDE-RULES.md, và
docs/03-backend/phase2-auth/README.md.
Implement toàn bộ theo spec.
```

### Bước 4: Review git diff
```bash
git diff
git status
```

Checklist:
- [ ] Tuân thủ 00-CLAUDE-RULES.md
- [ ] Không hardcode secret
- [ ] Response format đúng
- [ ] Không `console.log`
- [ ] Validation đầy đủ

### Bước 5: Commit hoặc Revert

Nếu ổn:
```bash
git add .
git commit -m "feat(auth): implement login API"
```

Nếu hỏng:
```bash
git restore .
```

## Merge feature → develop
```bash
git checkout feature/backend-auth
git fetch origin
git rebase develop
pnpm test
git push origin feature/backend-auth

git checkout develop
git merge feature/backend-auth
git push origin develop
git branch -d feature/backend-auth
```

## Merge develop → main
Chỉ khi:
- Tất cả test pass
- Đã test manual
- Không conflict

```bash
git checkout main
git pull
git merge develop
git push origin main

git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Xử lý conflict
```bash
git status              # Xem file conflict
# Sửa file, tìm dấu <<<<<<<
git add .
git commit -m "merge: resolve conflict"
```

## Lệnh hữu ích
```bash
git log --oneline --graph --all    # Xem lịch sử đẹp
git stash && git stash pop          # Tạm lưu thay đổi
git reset --soft HEAD~1             # Hủy commit, giữ changes
git reset --hard HEAD~1             # Hủy commit, mất changes
```