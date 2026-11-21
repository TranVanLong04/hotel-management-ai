# -*- coding: utf-8 -*-
"""Generate high-resolution professional diagrams for Chapter 3."""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagram_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Calibri']
plt.rcParams['axes.edgecolor'] = '#333333'


def draw_usecase_diagram():
    """Hình 3.1: Sơ đồ Use Case tổng quát của hệ thống."""
    fig, ax = plt.subplots(figsize=(12, 10), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 11)
    ax.axis('off')

    # Background system box
    sys_box = patches.FancyBboxPatch(
        (2.8, 0.5), 6.4, 9.8,
        boxstyle="round,pad=0.2,rounding_size=0.2",
        facecolor="#F8FAFC", edgecolor="#1E3A8A", linewidth=2.5
    )
    ax.add_patch(sys_box)
    ax.text(6.0, 10.0, "HỆ THỐNG QUẢN LÝ KHÁCH SẠN THÔNG MINH GRAND LUXURY",
            ha='center', va='center', fontsize=11, fontweight='bold', color="#1E3A8A")

    # Actors
    def draw_actor(x, y, name, color="#1E3A8A"):
        # Head
        head = patches.Circle((x, y + 0.35), 0.22, facecolor="#DBEAFE", edgecolor=color, linewidth=2)
        ax.add_patch(head)
        # Body
        ax.plot([x, x], [y + 0.13, y - 0.25], color=color, linewidth=2.5)
        # Arms
        ax.plot([x - 0.35, x + 0.35], [y, y], color=color, linewidth=2.5)
        # Legs
        ax.plot([x, x - 0.25], [y - 0.25, y - 0.65], color=color, linewidth=2.5)
        ax.plot([x, x + 0.25], [y - 0.25, y - 0.65], color=color, linewidth=2.5)
        # Label
        ax.text(x, y - 0.9, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color=color)

    # Actor 1: Guest (Left)
    draw_actor(1.2, 7.5, "Khách hàng\n(Guest / Customer)", "#2563EB")

    # Actor 2: Kiosk Terminal (Left Bottom)
    draw_actor(1.2, 3.2, "Máy Kiosk Tự phục vụ\n(Kiosk AI Terminal)", "#059669")

    # Actor 3: Admin / Staff (Right)
    draw_actor(10.8, 5.5, "Lễ tân / Quản trị viên\n(Staff / Admin)", "#DC2626")

    # Use Cases (Ovals in center)
    use_cases = [
        (6.0, 9.2, "UC1: Đăng ký & Đăng nhập tài khoản (JWT)"),
        (6.0, 8.0, "UC2: Tra cứu phòng & Đặt phòng trực tuyến"),
        (6.0, 6.8, "UC3: Đăng ký hồ sơ khuôn mặt (Webcam)"),
        (6.0, 5.6, "UC4: Tự động Check-in bằng nhận diện AI"),
        (6.0, 4.4, "UC5: Tư vấn & Trò chuyện với Trợ lý ảo AI"),
        (6.0, 3.2, "UC6: Quản trị buồng phòng & Dịch vụ phát sinh"),
        (6.0, 2.0, "UC7: Check-out & Thanh toán Hóa đơn (MoMo/Thẻ)"),
        (6.0, 0.9, "UC8: Thống kê doanh thu & Đối soát mô hình AI"),
    ]

    for x, y, text in use_cases:
        oval = patches.FancyBboxPatch(
            (x - 2.5, y - 0.4), 5.0, 0.8,
            boxstyle="round,pad=0.1,rounding_size=0.4",
            facecolor="#FFFFFF", edgecolor="#3B82F6", linewidth=1.5
        )
        ax.add_patch(oval)
        ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color="#1E293B")

    # Connector lines
    def line(x1, y1, x2, y2, color="#64748B"):
        ax.plot([x1, x2], [y1, y2], color=color, linewidth=1.4, linestyle='-', alpha=0.85)

    # Guest connections
    line(1.6, 7.5, 3.5, 9.2, "#2563EB")
    line(1.6, 7.5, 3.5, 8.0, "#2563EB")
    line(1.6, 7.5, 3.5, 6.8, "#2563EB")
    line(1.6, 7.5, 3.5, 4.4, "#2563EB")

    # Kiosk connection
    line(1.6, 3.2, 3.5, 5.6, "#059669")

    # Staff / Admin connections
    line(10.4, 5.5, 8.5, 9.2, "#DC2626")
    line(10.4, 5.5, 8.5, 3.2, "#DC2626")
    line(10.4, 5.5, 8.5, 2.0, "#DC2626")
    line(10.4, 5.5, 8.5, 0.9, "#DC2626")
    line(10.4, 5.5, 8.5, 5.6, "#DC2626") # Manual review

    out_path = os.path.join(OUTPUT_DIR, "usecase_diagram.png")
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", out_path)


def draw_architecture_diagram():
    """Hình 3.2: Sơ đồ khối kiến trúc hệ thống đa tầng."""
    fig, ax = plt.subplots(figsize=(12, 11), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 12)
    ax.axis('off')

    def layer_box(y, h, title, fill, border):
        box = patches.FancyBboxPatch(
            (0.5, y), 11.0, h,
            boxstyle="round,pad=0.15,rounding_size=0.15",
            facecolor=fill, edgecolor=border, linewidth=2
        )
        ax.add_patch(box)
        ax.text(0.8, y + h - 0.35, title, fontsize=10.5, fontweight='bold', color=border)

    def sub_box(x, y, w, h, title, desc, fill, border):
        b = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.1,rounding_size=0.12",
            facecolor=fill, edgecolor=border, linewidth=1.5
        )
        ax.add_patch(b)
        ax.text(x + w/2, y + h*0.65, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color="#0F172A")
        ax.text(x + w/2, y + h*0.28, desc, ha='center', va='center', fontsize=7.5, color="#334155")

    # Layer 1: Client Presentation
    layer_box(9.0, 2.6, "TẦNG 1: GIAO DIỆN NGƯỜI DÙNG (CLIENT PRESENTATION LAYER)", "#EFF6FF", "#1D4ED8")
    sub_box(1.0, 9.3, 3.1, 1.7, "Web Portal Khách hàng", "React 18 + Vite + Tailwind\nTìm phòng, Đặt phòng, Đăng ký mặt", "#FFFFFF", "#3B82F6")
    sub_box(4.5, 9.3, 3.0, 1.7, "Kiosk Check-in Tự phục vụ", "React 18 + Webcam Canvas\nChụp ảnh thực tế, Check-in AI < 1s", "#FFFFFF", "#10B981")
    sub_box(7.9, 9.3, 3.2, 1.7, "Admin Dashboard Quản trị", "React 18 + Zustand State\nSơ đồ phòng, Hóa đơn, AI Compare", "#FFFFFF", "#EF4444")

    # Layer 2: API Gateway & Business Logic
    layer_box(6.0, 2.5, "TẦNG 2: CỔNG NGHIỆP VỤ & ĐIỀU PHỐI (BACKEND API GATEWAY LAYER)", "#F8FAFC", "#0F172A")
    sub_box(1.0, 6.3, 2.3, 1.7, "Bảo mật & Xác thực", "Node.js + Express 4\nJWT, Bcrypt, Role RBAC", "#FFFFFF", "#64748B")
    sub_box(3.6, 6.3, 2.4, 1.7, "Quản lý Nghiệp vụ", "Bookings, Rooms, Invoices,\nPayments, Services Logic", "#FFFFFF", "#64748B")
    sub_box(6.3, 6.3, 2.4, 1.7, "Kiểm soát Dữ liệu", "Zod DTO Validation,\nSnapshot Giá, Soft Delete", "#FFFFFF", "#64748B")
    sub_box(9.0, 6.3, 2.1, 1.7, "Tích hợp Thanh toán", "Cổng MoMo Sandbox API,\nVietQR & Thẻ tín dụng", "#FFFFFF", "#64748B")

    # Layer 3: AI Microservices
    layer_box(3.1, 2.5, "TẦNG 3: CÁC DỊCH VỤ TRÍ TUỆ NHÂN TẠO (AI MICROSERVICES LAYER)", "#FAF5FF", "#7E22CE")
    sub_box(1.0, 3.4, 4.7, 1.7, "AI Face Service (FastAPI / Port 8000)", "InsightFace: RetinaFace (Phát hiện) + ArcFace R100 (512D Vector)\nONNX Runtime AVX2 tối ưu hóa CPU, Cosine Similarity", "#FFFFFF", "#9333EA")
    sub_box(6.3, 3.4, 4.8, 1.7, "AI Chatbot Service (FastAPI / Port 8001)", "LangChain Autonomous Agent + RAG Pipeline\nOpenAI / Gemini Embeddings 768D, Tool Calling Nghiệp vụ", "#FFFFFF", "#A855F7")

    # Layer 4: Data Persistence
    layer_box(0.4, 2.3, "TẦNG 4: CƠ SỞ DỮ LIỆU & LƯU TRỮ ĐÁM MÂY (DATA PERSISTENCE LAYER)", "#F0FDF4", "#15803D")
    sub_box(1.0, 0.7, 3.8, 1.5, "Supabase PostgreSQL (Port 5432)", "10 bảng nghiệp vụ chuẩn 3NF\n(users, bookings, rooms, invoices...)", "#FFFFFF", "#16A34A")
    sub_box(5.1, 0.7, 3.4, 1.5, "Mở rộng pgvector (HNSW Index)", "Lập chỉ mục đồ thị phân tầng\nVector 512D mặt & Vector 768D tri thức", "#FFFFFF", "#16A34A")
    sub_box(8.8, 0.7, 2.3, 1.5, "Supabase Storage", "Bucket faces bảo mật\nLưu trữ ảnh chân dung gốc", "#FFFFFF", "#16A34A")

    # Connecting Arrows between layers
    def v_arrow(x, y1, y2, label=""):
        ax.annotate('', xy=(x, y2), xytext=(x, y1),
                    arrowprops=dict(facecolor="#475569", edgecolor="#475569", width=1.5, headwidth=6))
        if label:
            ax.text(x + 0.15, (y1 + y2)/2, label, fontsize=8, color="#475569", fontweight='bold')

    v_arrow(2.5, 9.0, 8.5, "HTTP REST")
    v_arrow(6.0, 9.0, 8.5, "HTTP REST")
    v_arrow(9.5, 9.0, 8.5, "HTTP REST")

    v_arrow(3.3, 6.0, 5.6, "X-API-Key / Embed")
    v_arrow(8.7, 6.0, 5.6, "Tool Execution")

    v_arrow(2.9, 3.1, 2.7, "SQL Query")
    v_arrow(6.8, 3.1, 2.7, "<=> Cosine Distance")
    v_arrow(10.0, 3.1, 2.7, "Storage API")

    out_path = os.path.join(OUTPUT_DIR, "system_architecture_diagram.png")
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", out_path)


def draw_sequence_diagram():
    """Hình 3.3: Sơ đồ tuần tự (Sequence Diagram) xử lý Check-in bằng khuôn mặt."""
    fig, ax = plt.subplots(figsize=(12, 10), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 12)
    ax.axis('off')

    cols = [
        (1.2, "Khách hàng\n(Guest)"),
        (3.4, "Kiosk Web UI\n(React 18)"),
        (6.0, "AI Face Service\n(FastAPI /embed)"),
        (8.5, "Backend API\n(Express Gateway)"),
        (11.0, "Supabase CSDL\n(PostgreSQL/pgvector)"),
    ]

    # Draw lifelines
    for x, title in cols:
        # Header box
        h_box = patches.FancyBboxPatch(
            (x - 0.9, 10.8), 1.8, 0.9,
            boxstyle="round,pad=0.1,rounding_size=0.1",
            facecolor="#1E3A8A", edgecolor="#1E3A8A"
        )
        ax.add_patch(h_box)
        ax.text(x, 11.25, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color="#FFFFFF")
        # Line
        ax.plot([x, x], [10.8, 0.8], color="#94A3B8", linestyle="--", linewidth=1.2)

    # Message arrows
    def msg(y, x1, x2, num, text, dashed=False, color="#1E293B"):
        style = "--" if dashed else "-"
        ax.annotate(
            '', xy=(x2, y), xytext=(x1, y),
            arrowprops=dict(facecolor=color, edgecolor=color, width=1.0, headwidth=5, shrink=0.01, linestyle=style)
        )
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 0.18, f"{num}. {text}", ha='center', va='bottom', fontsize=8, fontweight='bold', color=color)

    msg(10.2, 1.2, 3.4, "1", "Đứng trước camera Kiosk tự phục vụ", color="#2563EB")
    msg(9.4, 3.4, 6.0, "2", "Chụp frame & POST /embed (Multipart image)", color="#7E22CE")
    
    # Internal box at AI service
    note1 = patches.Rectangle((5.3, 8.4), 1.4, 0.7, facecolor="#F3E8FF", edgecolor="#A855F7", linewidth=1)
    ax.add_patch(note1)
    ax.text(6.0, 8.75, "RetinaFace căn chỉnh\nArcFace trích xuất 512D", ha='center', va='center', fontsize=7, color="#581C87")

    msg(7.8, 6.0, 3.4, "3", "Trả về embedding[512] đã chuẩn hóa L2", dashed=True, color="#7E22CE")
    msg(7.0, 3.4, 8.5, "4", "POST /api/checkin/face-match { embedding }", color="#0F172A")
    msg(6.2, 8.5, 11.0, "5", "SQL: SELECT customer_id ORDER BY embedding <=> v LIMIT 1", color="#15803D")
    msg(5.4, 11.0, 8.5, "6", "Trả về customer_id & Cosine Similarity (3ms HNSW)", dashed=True, color="#15803D")

    # Internal box at Backend
    note2 = patches.Rectangle((7.5, 4.1), 2.0, 0.9, facecolor="#EFF6FF", edgecolor="#3B82F6", linewidth=1)
    ax.add_patch(note2)
    ax.text(8.5, 4.55, "Kiểm tra Similarity ≥ 0.75\nĐối chiếu Booking hôm nay\nUPDATE Booking & Room", ha='center', va='center', fontsize=7, color="#1E3A8A")

    msg(3.5, 8.5, 11.0, "7", "COMMIT: status='checked_in', room='occupied'", color="#15803D")
    msg(2.7, 11.0, 8.5, "8", "Giao dịch thành công", dashed=True, color="#15803D")
    msg(1.9, 8.5, 3.4, "9", "200 OK: Số phòng, mã mở cửa, thông tin đơn", dashed=True, color="#0F172A")
    msg(1.1, 3.4, 1.2, "10", "Màn hình chào mừng, cấp mã PIN & in phiếu nhận phòng", color="#2563EB")

    out_path = os.path.join(OUTPUT_DIR, "sequence_diagram_checkin.png")
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", out_path)


def draw_erd_diagram():
    """Hình 3.4: Sơ đồ quan hệ thực thể (ERD) cơ sở dữ liệu hệ thống."""
    fig, ax = plt.subplots(figsize=(13, 10), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 11)
    ax.axis('off')

    def entity_box(x, y, w, h, name, fields, color="#1E3A8A", bg="#F8FAFC"):
        box = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.08,rounding_size=0.1",
            facecolor=bg, edgecolor=color, linewidth=1.5
        )
        ax.add_patch(box)
        # Header banner
        header = patches.Rectangle((x, y + h - 0.45), w, 0.45, facecolor=color, edgecolor=color)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - 0.22, name, ha='center', va='center', fontsize=8.5, fontweight='bold', color="#FFFFFF")
        # Field lines
        for idx, f in enumerate(fields):
            ax.text(x + 0.12, y + h - 0.7 - idx * 0.28, f, fontsize=7.2, color="#1E293B")

    # Table 1: USERS
    entity_box(0.5, 7.5, 2.6, 2.8, "USERS", [
        "id: UUID [PK]",
        "username: TEXT",
        "email: TEXT",
        "role: 'admin'|'staff'|'cust'",
        "is_active: BOOLEAN",
        "created_at: TIMESTAMPTZ"
    ], color="#1E3A8A")

    # Table 2: CUSTOMERS
    entity_box(3.6, 7.5, 2.7, 2.8, "CUSTOMERS", [
        "id: UUID [PK]",
        "user_id: UUID [FK -> users]",
        "full_name: TEXT",
        "phone: TEXT",
        "identity_number: TEXT",
        "is_active: BOOLEAN"
    ], color="#1E3A8A")

    # Table 3: FACE_PROFILES
    entity_box(3.6, 3.8, 2.7, 2.8, "FACE_PROFILES", [
        "id: UUID [PK]",
        "customer_id: UUID [FK]",
        "face_image_url: TEXT",
        "face_embedding: vector(512)",
        "confidence: FLOAT",
        "is_active: BOOLEAN"
    ], color="#7E22CE", bg="#FAF5FF")

    # Table 4: BOOKINGS
    entity_box(6.8, 7.2, 2.8, 3.4, "BOOKINGS", [
        "id: UUID [PK]",
        "customer_id: UUID [FK]",
        "room_id: UUID [FK]",
        "check_in_date: DATE",
        "check_out_date: DATE",
        "room_price: NUMERIC",
        "status: BookingStatus",
        "face_status: 'verified'...",
        "actual_check_in_at: TIME"
    ], color="#15803D", bg="#F0FDF4")

    # Table 5: ROOMS & ROOM_TYPES
    entity_box(10.0, 7.5, 2.5, 2.8, "ROOMS", [
        "id: UUID [PK]",
        "room_number: TEXT",
        "room_type_id: UUID [FK]",
        "status: RoomStatus",
        "floor: INTEGER",
        "is_active: BOOLEAN"
    ], color="#059669")

    entity_box(10.0, 4.0, 2.5, 2.6, "ROOM_TYPES", [
        "id: UUID [PK]",
        "name: TEXT",
        "base_price: NUMERIC",
        "max_guests: INTEGER",
        "amenities: TEXT",
        "image_url: TEXT"
    ], color="#059669")

    # Table 6: INVOICES & PAYMENTS
    entity_box(6.8, 3.8, 2.8, 2.8, "INVOICES", [
        "id: UUID [PK]",
        "booking_id: UUID [FK, UQ]",
        "total_amount: NUMERIC",
        "tax_rate: NUMERIC",
        "status: 'unpaid'|'paid'...",
        "created_at: TIMESTAMPTZ"
    ], color="#B45309", bg="#FFFBEB")

    entity_box(6.8, 0.5, 2.8, 2.6, "PAYMENTS", [
        "id: UUID [PK]",
        "invoice_id: UUID [FK]",
        "amount: NUMERIC",
        "method: 'momo'|'card'|'cash'",
        "status: 'completed'...",
        "paid_at: TIMESTAMPTZ"
    ], color="#B45309", bg="#FFFBEB")

    # Table 7: CHAT_KNOWLEDGE_CHUNKS (RAG Vector)
    entity_box(0.5, 3.8, 2.6, 2.8, "CHAT_KNOWLEDGE_CHUNKS", [
        "id: UUID [PK]",
        "chunk_index: INTEGER",
        "title: TEXT",
        "content: TEXT",
        "access_level: 'public'|'admin'",
        "embedding: vector(768)"
    ], color="#4338CA", bg="#EEF2FF")

    # Relationship connectors
    def rel(x1, y1, x2, y2, label="1..N"):
        ax.plot([x1, x2], [y1, y2], color="#64748B", linewidth=1.5, linestyle=":")
        mid_x, mid_y = (x1 + x2)/2, (y1 + y2)/2
        ax.text(mid_x, mid_y + 0.1, label, fontsize=7.5, fontweight='bold', color="#475569")

    rel(3.1, 8.8, 3.6, 8.8, "1 : 1")
    rel(4.9, 7.5, 4.9, 6.6, "1 : N")
    rel(6.3, 8.8, 6.8, 8.8, "1 : N")
    rel(9.6, 8.8, 10.0, 8.8, "N : 1")
    rel(11.2, 7.5, 11.2, 6.6, "N : 1")
    rel(8.2, 7.2, 8.2, 6.6, "1 : 1")
    rel(8.2, 3.8, 8.2, 3.1, "1 : N")

    out_path = os.path.join(OUTPUT_DIR, "erd_diagram.png")
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", out_path)


if __name__ == "__main__":
    draw_usecase_diagram()
    draw_architecture_diagram()
    draw_sequence_diagram()
    draw_erd_diagram()
    print("All 4 Chapter 3 diagrams generated successfully!")
