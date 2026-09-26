# AI Service Architecture

## Mục đích
Python FastAPI service xử lý:
- Phát hiện khuôn mặt (RetinaFace)
- Tạo embedding 512D (ArcFace-R100)
- So khớp 2 embeddings (cosine similarity)

## Tech stack
- FastAPI + Uvicorn
- InsightFace buffalo_l (RetinaFace + ArcFace)
- OpenCV (headless)
- NumPy

## Cấu trúc
```
app/
├── main.py              ← FastAPI app + CORS + startup
├── api/
│   ├── deps.py          ← verify_api_key dependency
│   └── routes/
│       ├── health.py
│       ├── embed.py
│       └── compare.py
├── core/
│   ├── config.py        ← Pydantic Settings
│   └── logger.py
├── services/
│   ├── face_detection.py  ← RetinaFace, lazy load model
│   ├── embedding.py        ← ArcFace, L2 normalize
│   └── similarity.py       ← Cosine, threshold
└── models/
    └── schemas.py       ← Pydantic request/response
```

## Model loading
- **Lazy load**: Model chỉ load lần đầu khi có request
- Global `_app` variable, cache sau lần đầu
- Tránh load lại mỗi request

## Endpoints
- `GET /health` — Health check
- `POST /embed` — Image → embedding (multipart)
- `POST /compare` — 2 embeddings → similarity (JSON)
- `GET /docs` — Swagger UI

## Auth
- Header `X-API-Key` required cho mọi endpoint (trừ /health)
- So sánh với env `API_KEY`

## Performance
| Task | Target |
|------|--------|
| Embed 1 ảnh (CPU) | < 1s |
| Compare 2 vectors | < 10ms |
| Memory | < 2GB |
| Cold start | 15-25s |

## Config (env)
- HOST, PORT, LOG_LEVEL
- FACE_THRESHOLD (0.75)
- MODEL_NAME (buffalo_l)
- API_KEY

## Deployment
- Docker với pre-download model
- RAM ≥ 2GB
- Healthcheck `start-period=60s`