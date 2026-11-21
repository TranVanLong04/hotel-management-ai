# -*- coding: utf-8 -*-
"""Generate high-resolution professional flowchart diagrams for Chapter 2."""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Output directory for diagram images
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagram_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Set high DPI and font styling
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Calibri']
plt.rcParams['axes.edgecolor'] = '#333333'


def draw_flowchart_1():
    """Hình 2.1: Lưu đồ quy trình Đăng ký khuôn mặt của khách hàng."""
    fig, ax = plt.subplots(figsize=(10, 14), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 16)
    ax.axis('off')

    # Styles
    c_start = '#2B579A'      # Deep Blue
    c_process = '#E8F1F5'    # Soft Blue-Grey
    c_process_b = '#2B579A'  # Border
    c_decide = '#FFF3CD'     # Soft Yellow
    c_decide_b = '#856404'   # Border
    c_error = '#F8D7DA'      # Soft Red
    c_error_b = '#721C24'    # Border
    c_success = '#D4EDDA'    # Soft Green
    c_success_b = '#155724'  # Border

    def box(x, y, w, h, text, bg, border, fontsize=9, bold=False):
        rect = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h,
            boxstyle="round,pad=0.1,rounding_size=0.15",
            facecolor=bg, edgecolor=border, linewidth=1.5
        )
        ax.add_patch(rect)
        weight = 'bold' if bold else 'normal'
        ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
                fontweight=weight, color='#1A1A1A', multialignment='center')

    def oval(x, y, w, h, text, bg, border):
        patch = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h,
            boxstyle="round,pad=0.2,rounding_size=0.4",
            facecolor=bg, edgecolor=border, linewidth=2
        )
        ax.add_patch(patch)
        ax.text(x, y, text, ha='center', va='center', fontsize=10,
                fontweight='bold', color='white', multialignment='center')

    def diamond(x, y, w, h, text, bg, border, fontsize=8.5):
        pts = [[x, y + h/2], [x + w/2, y], [x, y - h/2], [x - w/2, y]]
        poly = patches.Polygon(pts, facecolor=bg, edgecolor=border, linewidth=1.5)
        ax.add_patch(poly)
        ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
                fontweight='bold', color='#1A1A1A', multialignment='center')

    def arrow(x1, y1, x2, y2, label=None, label_side='right', color='#2B579A'):
        ax.annotate(
            '', xy=(x2, y2), xytext=(x1, y1),
            arrowprops=dict(facecolor=color, edgecolor=color, width=1.2, headwidth=6, shrink=0.01)
        )
        if label:
            lx = (x1 + x2) / 2
            ly = (y1 + y2) / 2
            offset_x = 0.25 if label_side == 'right' else -0.35
            ax.text(lx + offset_x, ly, label, fontsize=8.5, fontweight='bold',
                    color='#721C24' if 'Không' in label else '#155724', va='center')

    # Draw Title
    ax.text(5, 15.6, "HÌNH 2.1: LƯU ĐỒ QUY TRÌNH ĐĂNG KÝ KHUÔN MẶT (FACE REGISTRATION)",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#1A365D')

    # Nodes
    oval(5, 14.8, 3.2, 0.6, "BẮT ĐẦU: Web Portal Khách hàng", c_start, '#1A365D')
    box(5, 13.8, 5.5, 0.65, "1. Bật Webcam chụp ảnh hoặc tải ảnh chân dung\n(Định dạng JPEG/PNG, dung lượng ≤ 5MB)", c_process, c_process_b)
    box(5, 12.8, 5.5, 0.65, "2. Frontend gửi ảnh (Multipart/form-data)\nlên Backend API: POST /api/faces/register", c_process, c_process_b)
    box(5, 11.8, 5.5, 0.65, "3. Backend xác thực JWT Token & tra cứu Customer ID;\nChuyển tiếp ảnh đến AI Face Service: POST /embed", c_process, c_process_b)
    box(5, 10.8, 5.5, 0.65, "4. AI Service: OpenCV giải mã ma trận ảnh BGR;\nRetinaFace phát hiện khuôn mặt & 5 điểm mốc landmarks", c_process, c_process_b)
    
    diamond(5, 9.6, 4.0, 1.0, "Phát hiện được khuôn mặt?\n(Faces Count > 0)", c_decide, c_decide_b)
    box(1.5, 9.6, 2.2, 0.7, "Trả lỗi 400:\nFACE_NOT_DETECTED", c_error, c_error_b, 8)

    box(5, 8.3, 5.5, 0.65, "5. Chọn khuôn mặt lớn nhất (Max Bbox);\nKiểm tra kích thước tối thiểu (≥ 80x80 px)", c_process, c_process_b)
    diamond(5, 7.1, 4.0, 1.0, "Kích thước Bbox\n≥ 80x80 pixel?", c_decide, c_decide_b)
    box(1.5, 7.1, 2.2, 0.7, "Trả lỗi 400:\nFACE_LOW_QUALITY", c_error, c_error_b, 8)

    box(5, 5.8, 5.5, 0.65, "6. Căn chỉnh khuôn mặt chuẩn 112x112 px (Affine Transform);\nArcFace (ResNet-100 buffalo_l) trích xuất vector 512D", c_process, c_process_b)
    box(5, 4.8, 5.5, 0.65, "7. Chuẩn hóa vector theo chuẩn L2 (||v||₂ = 1);\nAI Service trả về JSON embedding[512] cho Backend", c_process, c_process_b)
    box(5, 3.8, 5.5, 0.65, "8. Backend upload ảnh gốc lên Supabase Storage (bucket faces);\nLấy Public Image URL an toàn", c_process, c_process_b)
    box(5, 2.8, 5.5, 0.65, "9. Backend lưu vector 512D & Image URL vào bảng face_profiles\ntrên Supabase PostgreSQL (pgvector)", c_process, c_process_b)
    box(5, 1.8, 5.5, 0.6, "10. Thông báo đăng ký thành công cho khách hàng\n(Khách hàng sẵn sàng Check-in tự động tại Kiosk)", c_success, c_success_b, 9, True)
    oval(5, 0.8, 3.2, 0.6, "KẾT THÚC QUY TRÌNH", '#28A745', '#155724')

    # Arrows
    arrow(5, 14.5, 5, 14.15)
    arrow(5, 13.45, 5, 13.15)
    arrow(5, 12.45, 5, 12.15)
    arrow(5, 11.45, 5, 11.15)
    arrow(5, 10.45, 5, 10.1)

    arrow(3.0, 9.6, 2.6, 9.6, label="Không", label_side='bottom')
    arrow(1.5, 9.95, 1.5, 13.8)
    arrow(1.5, 13.8, 2.25, 13.8)

    arrow(5, 9.1, 5, 8.65, label="Có", label_side='right')
    arrow(5, 7.95, 5, 7.6)

    arrow(3.0, 7.1, 2.6, 7.1, label="Không", label_side='bottom')
    arrow(1.5, 7.45, 1.5, 9.25)

    arrow(5, 6.6, 5, 6.15, label="Có", label_side='right')
    arrow(5, 5.45, 5, 5.15)
    arrow(5, 4.45, 5, 4.15)
    arrow(5, 3.45, 5, 3.15)
    arrow(5, 2.45, 5, 2.1)
    arrow(5, 1.5, 5, 1.1)

    out_path = os.path.join(OUTPUT_DIR, "flowchart_face_registration.png")
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", out_path)


def draw_flowchart_2():
    """Hình 2.2: Lưu đồ quy trình Tự động Check-in bằng nhận diện khuôn mặt tại Kiosk."""
    fig, ax = plt.subplots(figsize=(10, 14), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 16)
    ax.axis('off')

    c_start = '#1E7E34'      # Dark Green
    c_process = '#F0F7F4'    # Mint Pale
    c_process_b = '#28A745'  # Border
    c_decide = '#FFF3CD'     # Yellow
    c_decide_b = '#856404'   # Border
    c_error = '#F8D7DA'      # Soft Red
    c_error_b = '#721C24'    # Border
    c_success = '#D4EDDA'    # Soft Green
    c_success_b = '#155724'  # Border

    def box(x, y, w, h, text, bg, border, fontsize=9, bold=False):
        rect = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h,
            boxstyle="round,pad=0.1,rounding_size=0.15",
            facecolor=bg, edgecolor=border, linewidth=1.5
        )
        ax.add_patch(rect)
        weight = 'bold' if bold else 'normal'
        ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
                fontweight=weight, color='#1A1A1A', multialignment='center')

    def oval(x, y, w, h, text, bg, border):
        patch = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h,
            boxstyle="round,pad=0.2,rounding_size=0.4",
            facecolor=bg, edgecolor=border, linewidth=2
        )
        ax.add_patch(patch)
        ax.text(x, y, text, ha='center', va='center', fontsize=10,
                fontweight='bold', color='white', multialignment='center')

    def diamond(x, y, w, h, text, bg, border, fontsize=8.5):
        pts = [[x, y + h/2], [x + w/2, y], [x, y - h/2], [x - w/2, y]]
        poly = patches.Polygon(pts, facecolor=bg, edgecolor=border, linewidth=1.5)
        ax.add_patch(poly)
        ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
                fontweight='bold', color='#1A1A1A', multialignment='center')

    def arrow(x1, y1, x2, y2, label=None, label_side='right', color='#1E7E34'):
        ax.annotate(
            '', xy=(x2, y2), xytext=(x1, y1),
            arrowprops=dict(facecolor=color, edgecolor=color, width=1.2, headwidth=6, shrink=0.01)
        )
        if label:
            lx = (x1 + x2) / 2
            ly = (y1 + y2) / 2
            offset_x = 0.25 if label_side == 'right' else -0.35
            ax.text(lx + offset_x, ly, label, fontsize=8.5, fontweight='bold',
                    color='#721C24' if 'Không' in label else '#155724', va='center')

    # Title
    ax.text(5, 15.6, "HÌNH 2.2: LƯU ĐỒ QUY TRÌNH TỰ ĐỘNG CHECK-IN BẰNG NHẬN DIỆN KHUÔN MẶT (KIOSK)",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#1E7E34')

    # Nodes
    oval(5, 14.8, 3.4, 0.6, "BẮT ĐẦU: Khách đứng trước Kiosk", c_start, '#155724')
    box(5, 13.8, 5.5, 0.65, "1. Camera Kiosk chụp khung hình khuôn mặt thực tế\n(Canvas Blob thời gian thực từ Webcam HD)", c_process, c_process_b)
    box(5, 12.8, 5.5, 0.65, "2. Gửi ảnh đến AI Face Service: POST /embed\n(RetinaFace căn chỉnh + ArcFace trích xuất vector 512D)", c_process, c_process_b)

    diamond(5, 11.6, 4.0, 1.0, "Trích xuất vector\nthành công?", c_decide, c_decide_b)
    box(1.5, 11.6, 2.2, 0.7, "Thông báo lỗi:\nNhìn thẳng ống kính", c_error, c_error_b, 8)

    box(5, 10.3, 5.5, 0.65, "3. Kiosk gửi vector v_query lên Backend API:\nPOST /api/checkin/face-match", c_process, c_process_b)
    box(5, 9.3, 5.5, 0.65, "4. Backend truy vấn Supabase pgvector (HNSW Index):\nSELECT customer_id, (1 - (embedding <=> v_query)) AS similarity", c_process, c_process_b)

    diamond(5, 8.0, 4.2, 1.1, "Cosine Similarity\n≥ Ngưỡng τ (0.75)?", c_decide, c_decide_b)
    box(1.5, 8.0, 2.4, 0.75, "Manual Review:\nLễ tân đối chiếu CCCD", c_error, c_error_b, 8)

    box(5, 6.6, 5.5, 0.65, "5. Xác định Customer ID hợp lệ;\nKiểm tra đơn đặt phòng (Bookings) trong ngày hiện tại", c_process, c_process_b)
    diamond(5, 5.3, 4.2, 1.1, "Có đơn Booking hôm nay\n& status = 'confirmed'?", c_decide, c_decide_b)
    box(1.5, 5.3, 2.4, 0.75, "Thông báo:\nKhông có đơn hôm nay", c_error, c_error_b, 8)

    box(5, 3.9, 5.5, 0.65, "6. Cập nhật Booking: status='checked_in', face_verified='verified'\nCập nhật Room: status='occupied'; Ghi log AI Comparison", c_process, c_process_b)
    box(5, 2.8, 5.5, 0.7, "7. Backend trả 200 OK kèm mã mở khóa phòng số Smart Lock;\nKiosk hiển thị màn hình chào mừng & in phiếu nhận phòng", c_success, c_success_b, 9, True)
    oval(5, 1.6, 3.6, 0.6, "HOÀN TẤT CHECK-IN (< 1 GIÂY)", '#28A745', '#155724')

    # Arrows
    arrow(5, 14.5, 5, 14.15)
    arrow(5, 13.45, 5, 13.15)
    arrow(5, 12.45, 5, 12.1)

    arrow(3.0, 11.6, 2.6, 11.6, label="Không", label_side='bottom')
    arrow(1.5, 11.95, 1.5, 13.8)
    arrow(1.5, 13.8, 2.25, 13.8)

    arrow(5, 11.1, 5, 10.65, label="Có", label_side='right')
    arrow(5, 9.95, 5, 9.65)
    arrow(5, 8.95, 5, 8.55)

    arrow(2.9, 8.0, 2.7, 8.0, label="Không", label_side='bottom')
    arrow(5, 7.45, 5, 6.95, label="Có", label_side='right')
    arrow(5, 6.25, 5, 5.85)

    arrow(2.9, 5.3, 2.7, 5.3, label="Không", label_side='bottom')
    arrow(5, 4.75, 5, 4.25, label="Có", label_side='right')
    arrow(5, 3.55, 5, 3.15)
    arrow(5, 2.45, 5, 1.9)

    out_path = os.path.join(OUTPUT_DIR, "flowchart_checkin_kiosk.png")
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", out_path)


def draw_flowchart_3():
    """Hình 2.3: Lưu đồ xử lý tin nhắn và gọi công cụ nghiệp vụ của Chatbot Agent (RAG + Tools)."""
    fig, ax = plt.subplots(figsize=(10, 14), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 16)
    ax.axis('off')

    c_start = '#6F42C1'      # Purple
    c_process = '#F3E8FF'    # Soft Purple
    c_process_b = '#6F42C1'  # Border
    c_decide = '#FFF3CD'     # Yellow
    c_decide_b = '#856404'   # Border
    c_rag = '#E0F2FE'        # Sky Blue
    c_rag_b = '#0369A1'      # Border
    c_tool = '#FEF3C7'       # Amber
    c_tool_b = '#D97706'     # Border
    c_success = '#D1FAE5'    # Mint Green
    c_success_b = '#059669'  # Border

    def box(x, y, w, h, text, bg, border, fontsize=8.5, bold=False):
        rect = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h,
            boxstyle="round,pad=0.1,rounding_size=0.15",
            facecolor=bg, edgecolor=border, linewidth=1.5
        )
        ax.add_patch(rect)
        weight = 'bold' if bold else 'normal'
        ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
                fontweight=weight, color='#1A1A1A', multialignment='center')

    def oval(x, y, w, h, text, bg, border):
        patch = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h,
            boxstyle="round,pad=0.2,rounding_size=0.4",
            facecolor=bg, edgecolor=border, linewidth=2
        )
        ax.add_patch(patch)
        ax.text(x, y, text, ha='center', va='center', fontsize=10,
                fontweight='bold', color='white', multialignment='center')

    def diamond(x, y, w, h, text, bg, border, fontsize=8.5):
        pts = [[x, y + h/2], [x + w/2, y], [x, y - h/2], [x - w/2, y]]
        poly = patches.Polygon(pts, facecolor=bg, edgecolor=border, linewidth=1.5)
        ax.add_patch(poly)
        ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
                fontweight='bold', color='#1A1A1A', multialignment='center')

    def arrow(x1, y1, x2, y2, label=None, label_side='right', color='#6F42C1'):
        ax.annotate(
            '', xy=(x2, y2), xytext=(x1, y1),
            arrowprops=dict(facecolor=color, edgecolor=color, width=1.2, headwidth=6, shrink=0.01)
        )
        if label:
            lx = (x1 + x2) / 2
            ly = (y1 + y2) / 2
            offset_x = 0.25 if label_side == 'right' else -0.35
            ax.text(lx + offset_x, ly, label, fontsize=8.5, fontweight='bold',
                    color='#721C24' if 'Không' in label else '#155724', va='center')

    # Title
    ax.text(5, 15.6, "HÌNH 2.3: LƯU ĐỒ RA QUYẾT ĐỊNH CỦA TRỢ LÝ ẢO AI CHATBOT (RAG + TOOL CALLING)",
            ha='center', va='center', fontsize=11, fontweight='bold', color='#6F42C1')

    # Nodes
    oval(5, 14.8, 3.4, 0.6, "BẮT ĐẦU: Khách gửi tin nhắn", c_start, '#4A1D96')
    box(5, 13.8, 5.5, 0.65, "1. Chatbot Service (FastAPI) nhận request;\nNạp Context: JWT Token, User ID, User Role", c_process, c_process_b)
    box(5, 12.8, 5.5, 0.65, "2. LangChain Orchestrator phân tích ý định (Intent)\n& Kiểm tra lịch sử hội thoại gần nhất", c_process, c_process_b)

    diamond(5, 11.5, 4.4, 1.1, "Yêu cầu dữ liệu động\nhoặc thực hiện tác vụ?", c_decide, c_decide_b)

    # Left Branch: Tool Calling
    box(2.6, 9.9, 3.8, 0.75, "Nhánh 1: LangChain Tool Calling\nChọn: search_rooms, create_booking,\nget_pricing, checkin_eligibility, maps...", c_tool, c_tool_b, 8)
    box(2.6, 8.6, 3.8, 0.7, "Gọi API Backend hoặc Bản đồ\ntruy xuất dữ liệu giao dịch thời gian thực", c_tool, c_tool_b, 8)
    box(2.6, 7.3, 3.8, 0.7, "Backend xử lý nghiệp vụ CSDL PostgreSQL;\nTrả về kết quả chuẩn JSON / Data Object", c_tool, c_tool_b, 8)
    box(2.6, 6.0, 3.8, 0.7, "Tạo thẻ Card tương tác UI:\nRoomCard, PaymentCard, MapCard...", c_tool, c_tool_b, 8)

    # Right Branch: RAG Pipeline
    box(7.4, 9.9, 3.8, 0.75, "Nhánh 2: RAG Pipeline (Tri thức)\nChuyển câu hỏi thành vector embedding 768D\n(OpenAI / Gemini Embedder)", c_rag, c_rag_b, 8)
    box(7.4, 8.6, 3.8, 0.7, "Gọi RPC match_knowledge_chunks\ntruy vấn Cosine Distance <=> trên pgvector", c_rag, c_rag_b, 8)
    box(7.4, 7.3, 3.8, 0.7, "Lọc quyền access_scope (public / admin);\nLấy Top-K chunks tài liệu có độ khớp cao nhất", c_rag, c_rag_b, 8)
    box(7.4, 6.0, 3.8, 0.7, "Ghép tri thức vào System Prompt;\nGửi đến LLM (GPT-4o-mini / Gemini) sinh text", c_rag, c_rag_b, 8)

    # Merge
    box(5, 4.6, 5.5, 0.7, "3. Tổng hợp phản hồi hoàn chỉnh:\nCâu trả lời ngôn ngữ tự nhiên + Thẻ giao diện tương tác (nếu có)", c_process, c_process_b, 9)
    box(5, 3.4, 5.5, 0.7, "4. Lưu lịch sử hội thoại vào CSDL Supabase:\nBảng chat_conversations & chat_messages", c_process, c_process_b, 9)
    box(5, 2.2, 5.5, 0.65, "5. Trả phản hồi về giao diện Web Portal / Kiosk\ncho khách hàng trải nghiệm tức thì", c_success, c_success_b, 9, True)
    oval(5, 1.1, 3.4, 0.6, "KẾT THÚC LƯỢT CHAT", '#28A745', '#155724')

    # Arrows
    arrow(5, 14.5, 5, 14.15)
    arrow(5, 13.45, 5, 13.15)
    arrow(5, 12.45, 5, 12.05)

    # Split
    ax.annotate('', xy=(2.6, 10.3), xytext=(3.4, 11.5),
                arrowprops=dict(facecolor='#D97706', edgecolor='#D97706', width=1.2, headwidth=6))
    ax.text(2.6, 11.0, "Có (Tools)", fontsize=8.5, fontweight='bold', color='#D97706')

    ax.annotate('', xy=(7.4, 10.3), xytext=(6.6, 11.5),
                arrowprops=dict(facecolor='#0369A1', edgecolor='#0369A1', width=1.2, headwidth=6))
    ax.text(6.8, 11.0, "Không (RAG)", fontsize=8.5, fontweight='bold', color='#0369A1')

    # Left chain
    arrow(2.6, 9.5, 2.6, 8.95, color='#D97706')
    arrow(2.6, 8.25, 2.6, 7.65, color='#D97706')
    arrow(2.6, 6.95, 2.6, 6.35, color='#D97706')

    # Right chain
    arrow(7.4, 9.5, 7.4, 8.95, color='#0369A1')
    arrow(7.4, 8.25, 7.4, 7.65, color='#0369A1')
    arrow(7.4, 6.95, 7.4, 6.35, color='#0369A1')

    # Merge to center
    ax.annotate('', xy=(4.0, 4.95), xytext=(2.6, 5.65),
                arrowprops=dict(facecolor='#D97706', edgecolor='#D97706', width=1.2, headwidth=6))
    ax.annotate('', xy=(6.0, 4.95), xytext=(7.4, 5.65),
                arrowprops=dict(facecolor='#0369A1', edgecolor='#0369A1', width=1.2, headwidth=6))

    arrow(5, 4.25, 5, 3.75)
    arrow(5, 3.05, 5, 2.55)
    arrow(5, 1.85, 5, 1.4)

    out_path = os.path.join(OUTPUT_DIR, "flowchart_chatbot_agent.png")
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", out_path)


if __name__ == "__main__":
    draw_flowchart_1()
    draw_flowchart_2()
    draw_flowchart_3()
    print("All 3 flowcharts generated successfully!")
