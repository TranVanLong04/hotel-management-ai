# Grand Luxury Hotel AI Chatbot Service

Dịch vụ AI Chatbot & RAG thông minh độc lập cho hệ thống Quản lý Khách sạn Grand Luxury.

---

## 1. Công nghệ sử dụng
- **Ngôn ngữ & Framework:** Python 3.10, FastAPI, Uvicorn
- **LLM & Embeddings:** OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`)
- **RAG & Agent:** LangChain, python-docx
- **Cơ sở dữ liệu:** Supabase PostgreSQL + `pgvector` (HNSW indexing)
- **Logging:** Loguru

---

## 2. Cấu trúc thư mục

```text
source/chatbot-service/
├── .env.example                      # Mẫu biến môi trường
├── .env                              # Biến môi trường thực tế (không commit)
├── .gitignore                        # Cấu hình bỏ qua file nhạy cảm
├── requirements.txt                  # Danh mục thư viện Python
├── README.md                         # Hướng dẫn kỹ thuật
├── db/
│   └── migrations/
│       └── create_chat_tables.sql    # Migration tạo bảng pgvector và chat
├── knowledge/
│   └── hotel_knowledge.docx          # File Word tài liệu kiến thức duy nhất
├── scripts/
│   ├── create_sample_docx.py         # Script tạo file DOCX mẫu chuẩn 5 sao
│   ├── sync_knowledge.py             # Script đồng bộ RAG vào Supabase pgvector
│   └── test_live_server.py           # Script test server live
├── tests/
│   ├── test_api_health.py            # Unit test endpoint /health
│   └── test_rag_pipeline.py          # Unit test DOCX parser & chunker
└── app/
    ├── __init__.py
    ├── main.py                       # FastAPI entrypoint & CORS
    ├── core/
    │   ├── config.py                 # Pydantic Settings
    │   └── logger.py                 # Cấu hình logging Loguru
    └── rag/
        ├── docx_parser.py            # Trích xuất headings, paragraphs, tables
        ├── chunker.py                # Semantic chunking & phân quyền (public/admin)
        ├── embeddings.py             # Gemini Embeddings 768D wrapper
        └── retriever.py              # Supabase pgvector cosine search
```

---

## 3. Hướng dẫn Cài đặt & Khởi chạy

### Bước 1: Khởi tạo Virtual Environment và Cài dependencies
```bash
cd source/chatbot-service
py -3.10 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Bước 2: Cấu hình file `.env`
Sao chép từ `.env.example` sang `.env` và điền:
- `SUPABASE_URL`: URL project Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key từ Supabase Dashboard.
- `GEMINI_API_KEY`: API Key lấy từ Google AI Studio.

### Bước 3: Chạy Migration trên Supabase Dashboard
1. Truy cập **Supabase Dashboard** -> **SQL Editor**.
2. Mở file `db/migrations/create_chat_tables.sql`.
3. Nhấn **Run** để khởi tạo các bảng:
   - `chat_knowledge_versions`
   - `chat_knowledge_chunks` (kèm HNSW index trên vector 768D)
   - `chat_conversations`
   - `chat_messages`
   - `chat_tool_executions`
   - RPC function `match_knowledge_chunks`

### Bước 4: Đồng bộ Tri thức từ DOCX lên Supabase
```bash
# Tạo/cập nhật file DOCX mẫu (nếu cần)
python scripts/create_sample_docx.py

# Đồng bộ dữ liệu vector vào Supabase pgvector
python scripts/sync_knowledge.py

# Nếu muốn ép nạp lại dữ liệu dù file chưa đổi
python scripts/sync_knowledge.py --force
```

### Bước 5: Chạy Kiểm thử (Unit Tests)
```bash
pytest tests -v
```

### Bước 6: Khởi động Server Chatbot Service
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
Kiểm tra endpoint: `http://localhost:8001/api/v1/health` hoặc tài liệu Swagger UI tại `http://localhost:8001/docs`.

