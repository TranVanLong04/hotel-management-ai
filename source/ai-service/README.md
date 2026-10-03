# AI Service — Hotel Management AI

Dịch vụ AI nhận diện khuôn mặt phục vụ xác thực Check-in tự động cho hệ thống Quản lý Khách sạn.

## 🛠 Tech Stack
- **Framework:** Python 3.10 / 3.11 + FastAPI + Uvicorn
- **AI Models:** InsightFace `buffalo_l` (RetinaFace + ArcFace-R100)
- **Runtime:** ONNX Runtime (CPU Execution Provider)
- **Image Processing:** OpenCV headless + Pillow + NumPy
- **Validation & Auth:** Pydantic v2 + X-API-Key

---

## 📂 Cấu trúc thư mục

```
source/ai-service/
├── app/
│   ├── main.py                  # FastAPI App, CORS, Logging Middleware, Exception Handlers
│   ├── api/
│   │   ├── deps.py              # X-API-Key verification dependency
│   │   └── routes/
│   │       ├── health.py        # GET /health
│   │       ├── embed.py         # POST /embed
│   │       └── compare.py       # POST /compare
│   ├── core/
│   │   ├── config.py            # Pydantic Settings (.env)
│   │   └── logger.py            # Structured JSON Logger
│   ├── services/
│   │   ├── face_detection.py    # Singleton FaceAnalysis (buffalo_l)
│   │   ├── embedding.py         # Trích xuất & L2 normalize vector 512D
│   │   └── similarity.py        # Tính Cosine similarity & threshold
│   └── models/
│       └── schemas.py           # Pydantic schemas (Request/Response envelope)
├── tests/
│   ├── conftest.py              # Pytest client fixtures
│   ├── test_api.py              # Unit & Integration tests
│   └── fixtures/                # Sample images phục vụ test
├── .env.example
├── requirements.txt
└── README.md
```

---

## 🚀 Cài đặt & Khởi chạy

### 1. Môi trường Python
Yêu cầu **Python 3.10** hoặc **Python 3.11** (64-bit) và [Microsoft Visual C++ 2015-2022 Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe).

```bash
# Tạo Virtual Environment
py -3.10 -m venv venv

# Kích hoạt môi trường (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Cài đặt dependencies
pip install "cython<3.0.0" setuptools wheel
pip install -r requirements.txt --no-build-isolation
```

### 2. Cấu hình biến môi trường (`.env`)
Copy từ `.env.example`:
```bash
cp .env.example .env
```
Nội dung `.env`:
```env
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
MODEL_NAME=buffalo_l
FACE_THRESHOLD=0.75
API_KEY=dev-key-12345
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Chạy Service
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Truy cập Swagger UI tài liệu API tại: `http://localhost:8000/docs`

---

## 🧪 Chạy Test & Kiểm tra Độ phủ (Coverage)

```bash
pytest --cov=app --cov-report=term-missing
```

---

## 📡 Danh sách Endpoints

### 1. `GET /health`
- **Mô tả:** Kiểm tra trạng thái hoạt động của server và trạng thái nạp mô hình.
- **Header:** Không yêu cầu auth.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "model_loaded": true,
      "uptime_seconds": 12.34,
      "version": "1.0.0"
    }
  }
  ```

### 2. `POST /embed`
- **Mô tả:** Nhận file ảnh tải lên, phát hiện khuôn mặt và trích xuất vector 512 chiều đã chuẩn hóa L2.
- **Header:** `X-API-Key: dev-key-12345`
- **Body:** `multipart/form-data` với field `image` (JPG/PNG, $\le 5\text{MB}$).
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "embedding": [0.0123, -0.0456, "... 512 floats ..."],
      "model_version": "buffalo_l",
      "face_detected": true,
      "bbox": [50.2, 45.0, 220.5, 260.1],
      "confidence": 0.9982
    }
  }
  ```

### 3. `POST /compare`
- **Mô tả:** So sánh độ tương đồng giữa 2 vector embedding 512 chiều.
- **Header:** `X-API-Key: dev-key-12345`
- **Body:**
  ```json
  {
    "embedding1": [/* 512 floats */],
    "embedding2": [/* 512 floats */],
    "threshold": 0.75
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "similarity": 0.8854,
      "is_match": true,
      "threshold": 0.75,
      "distance": 0.1146
    }
  }
  ```

---

## 🔒 Quy tắc Bảo mật & Tuân thủ
- Tuyệt đối **KHÔNG log** nội dung nhị phân/base64 của ảnh và vector embedding.
- Tất cả các lỗi đều trả về format chuẩn `{ success: false, error: { code, message } }`.
- Sử dụng mô hình `buffalo_l` chuẩn hóa $L_2$ đồng nhất trên toàn hệ thống.
