# AI Service Deploy (Railway + Docker)

## Thách thức
- Model InsightFace ~300MB
- RAM cần ≥ 2GB
- Cold start 15-25s

## Chuẩn bị

### `Dockerfile`
- Base: `python:3.10-slim`
- System deps: `build-essential`, `libglib2.0-0`, `libsm6`, `libxext6`, `libxrender-dev`, `libgomp1`
- Install requirements trước (cache layer)
- Copy source sau
- **Pre-download model** trong image: chạy Python 1 lần để trigger download
- Healthcheck với `start-period=60s`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### `requirements.txt`
Dùng `opencv-python-headless` (không GUI) để image nhẹ hơn.
Pin version cụ thể.

### Config đọc PORT từ env
`uvicorn.run(..., port=int(os.getenv('PORT', 8000)))` — Railway cấp PORT.

## Deploy steps

1. Push code lên GitHub
2. Railway → New → GitHub Repo → chọn repo
3. Railway detect Dockerfile → dùng Docker builder
4. **Settings → Source:** Root Directory: `source/ai-service`
5. **Variables:** PORT=8000, API_KEY, FACE_THRESHOLD, MODEL_NAME, LOG_LEVEL
6. **Settings → Resources:** RAM ≥ 2GB, CPU 1 vCPU
7. **Generate Domain**
8. Test: `curl https://ai-xxx.up.railway.app/health`
9. Update `AI_SERVICE_URL` ở backend + redeploy backend

## Troubleshooting
| Lỗi | Fix |
|-----|-----|
| Killed khi build | Tăng RAM build |
| Cold start > 60s | Healthcheck start-period=60s |
| libGL.so.1 not found | Thêm `libglib2.0-0` |
| Segfault | Pin version onnxruntime |
| Timeout embed | Tăng CPU |
| Memory exceeded | Tăng RAM lên 2GB |

## Giảm cold start
1. Pre-download model trong Docker image (đã làm)
2. Railway Keep Alive (service luôn chạy)
3. Volume cache

## Benchmarks
| Task | 1 vCPU |
|------|--------|
| Cold start | 15-25s |
| Embed 1 ảnh | 500-800ms |
| Compare 2 vectors | 2ms |

## Chi phí
- RAM 2GB: ~$10-15/tháng
- Cách tiết kiệm: Serverless (nhưng cold start lâu hơn)