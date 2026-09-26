# Setup AI Service

## Yêu cầu
- Python 3.10+
- Internet (lần đầu download model)

## Cài đặt

```bash
cd source/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install fastapi "uvicorn[standard]" python-multipart
pip install insightface onnxruntime opencv-python-headless
pip install numpy pillow python-dotenv pydantic-settings
pip install pytest httpx
```

## `requirements.txt`

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
insightface==0.7.3
onnxruntime==1.16.0
opencv-python-headless==4.8.1.78
numpy==1.24.3
pillow==10.1.0
python-dotenv==1.0.0
pydantic-settings==2.1.0
pytest==7.4.3
```

## Cấu trúc folder

```
app/
├── main.py              ← FastAPI app
├── api/
│   ├── routes/          ← health, embed, compare
│   └── deps.py          ← API key dependency
├── core/
│   ├── config.py        ← settings
│   └── logger.py
├── services/
│   ├── face_detection.py    ← RetinaFace
│   ├── embedding.py          ← ArcFace
│   └── similarity.py         ← Cosine
└── models/
    └── schemas.py       ← Pydantic
tests/
requirements.txt
Dockerfile
.env
```

## Env

```
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
FACE_THRESHOLD=0.75
MODEL_NAME=buffalo_l
API_KEY=dev-api-key
```

## Chạy

```bash
uvicorn app.main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

## Lưu ý
- Lần đầu chạy tự download model (~300MB) vào `~/.insightface/`
- Model nằm ngoài project, không commit vào Git

## Reference
- AI architecture: `docs/02-system-design/ai-service/01-architecture.md`
- Chi tiết implementation: `docs/05-ai-service/`