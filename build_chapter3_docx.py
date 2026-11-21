# -*- coding: utf-8 -*-
"""Generate official academic Chapter 3 DOCX document with embedded flowcharts, ERD, tables, and professional typography."""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "CHUONG_3_PHAN_TICH_VA_THIET_KE_HE_THONG.docx")
DIAGRAM_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagram_assets")


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets padding for table cells."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def set_cell_background(cell, color_hex):
    """Sets cell background shading."""
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._element.get_or_add_tcPr().append(parse_xml(shading_xml))


def create_chapter_3_document(output_path: str):
    doc = docx.Document()

    # Standard 1 inch page margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Style definitions
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)

    def add_p(text, space_after=6, line_spacing=1.25, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, color=None):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        if color:
            run.font.color.rgb = color
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = RGBColor(26, 54, 93) # Navy
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(43, 87, 154) # Blue
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(50, 50, 50)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.25
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        p.add_run(text)
        return p

    def add_figure(img_filename, caption_text, width_inches=6.0):
        img_path = os.path.join(DIAGRAM_DIR, img_filename)
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(10)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.add_run().add_picture(img_path, width=Inches(width_inches))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(14)
            r_cap = p_cap.add_run(caption_text)
            r_cap.italic = True
            r_cap.bold = True
            r_cap.font.size = Pt(10.5)
            r_cap.font.color.rgb = RGBColor(60, 60, 60)

    # ==================== DOCUMENT CONTENT ====================
    add_h1("CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG")

    # Section 3.1
    add_h2("3.1 Phân tích yêu cầu và lựa chọn phương pháp")

    # Section 3.1.1
    add_h3("3.1.1 Yêu cầu hệ thống")
    add_p(
        "Việc xây dựng Hệ thống Quản lý Khách sạn Thông minh Grand Luxury xuất phát từ các yêu cầu chức năng và phi chức năng "
        "được khảo sát và xác định rõ ràng, nhằm giải quyết bài toán ách tắc thủ tục nhận phòng giờ cao điểm, tự động hóa quy trình "
        "chăm sóc khách hàng và tối ưu hóa hiệu quả quản trị buồng phòng."
    )

    add_p("a) Yêu cầu chức năng (Functional Requirements)", bold=True)
    add_p("Hệ thống phục vụ 3 nhóm đối tượng người dùng chính với các chức năng cụ thể như sau:")

    add_bullet(
        "Phân hệ Khách hàng (Guest / Customer): ",
        "Đăng ký tài khoản, đăng nhập an toàn qua chuẩn JWT; tìm kiếm phòng trống theo ngày nhận, ngày trả và loại phòng; đặt phòng trực tuyến kèm dịch vụ phát sinh; đăng ký hồ sơ khuôn mặt trực tiếp qua webcam trình duyệt hoặc tải ảnh chân dung lên; quản lý lịch sử đặt phòng, tải hóa đơn điện tử; trò chuyện với Trợ lý ảo AI Chatbot để được tư vấn chính sách, tra cứu tiện ích và nhận hỗ trợ giao dịch 24/7."
    )
    add_bullet(
        "Phân hệ Tự phục vụ tại Kiosk (Kiosk Terminal): ",
        "Ghi nhận luồng hình ảnh khuôn mặt khách hàng thời gian thực qua camera Kiosk; gửi yêu cầu trích xuất đặc trưng tới AI Face Service; tự động hoàn tất thủ tục check-in trong thời gian dưới 1 giây; cập nhật trạng thái phòng và cấp phát mã khóa phòng thông minh kèm in phiếu nhận phòng."
    )
    add_bullet(
        "Phân hệ Quản trị viên và Nhân viên lễ tân (Admin / Staff): ",
        "Quản lý danh mục loại phòng và trạng thái buồng phòng thời gian thực (Trống, Đã đặt, Đang ở, Đang dọn dẹp, Bảo trì); quản lý danh sách hồ sơ khách hàng và dữ liệu nhận diện khuôn mặt; tiếp nhận, đổi phòng, hủy phòng và thực hiện Check-in thủ công (Manual Review) khi có yêu cầu đối chiếu CCCD; ghi nhận sử dụng dịch vụ minibar, giặt ủi; tạo và xuất hóa đơn VAT, đối soát giao dịch MoMo và thống kê báo cáo doanh thu."
    )

    add_p("b) Yêu cầu phi chức năng (Non-Functional Requirements)", bold=True)
    add_bullet(
        "Độ chính xác cao: ",
        "Mô hình AI nhận diện khuôn mặt phải đạt độ chính xác phân loại tổng thể trên 98% trên tập dữ liệu kiểm thử, tỷ lệ nhận nhầm (FAR) bắt buộc phải kiểm soát dưới 0.05% để đảm bảo an ninh tuyệt đối cho khách sạn."
    )
    add_bullet(
        "Độ trễ thấp (Real-time Latency): ",
        "Tốc độ xử lý của quy trình Check-in tự động tại Kiosk phải hoàn tất dưới 1.0 giây (thực tế đạt 745ms); các API giao dịch của Backend phải phản hồi dưới 200ms; thời gian sinh câu trả lời của Chatbot RAG không vượt quá 2.0 giây."
    )
    add_bullet(
        "Hoạt động ổn định và bền bỉ: ",
        "Hệ thống phải duy trì vận hành ổn định trong điều kiện ánh sáng sảnh khách sạn thay đổi (300 - 600 lux), góc quay khuôn mặt nghiêng đến ±45 độ, khách hàng đeo kính cận trong suốt hoặc thay đổi biểu cảm."
    )
    add_bullet(
        "An toàn và bảo mật sinh trắc học: ",
        "Tuyệt đối không lưu trữ ảnh khuôn mặt thô dạng nhị phân trong cơ sở dữ liệu quan hệ; dữ liệu sinh trắc học chỉ được lưu dưới dạng vector toán học 512 số thực đã chuẩn hóa L2 (mã hóa một chiều, không thể phục hồi ngược thành ảnh). Mật khẩu người dùng được băm bằng thuật toán bcrypt kèm muối an toàn."
    )
    add_bullet(
        "Tính toàn vẹn dữ liệu kế toán: ",
        "Toàn bộ giá phòng, giá dịch vụ tại thời điểm giao dịch phải được chụp lại (snapshot) vào hóa đơn; áp dụng quy tắc xóa mềm (Soft Delete) qua cờ is_active = FALSE để bảo tồn dữ liệu kiểm toán."
    )

    # Insert Figure 3.1
    add_figure("usecase_diagram.png", "Hình 3.1: Sơ đồ Use Case tổng quát của Hệ thống Quản lý Khách sạn Thông minh Grand Luxury")

    # Section 3.1.2
    add_h3("3.1.2 Lựa chọn phương pháp giải quyết")
    add_p(
        "Để đáp ứng đồng thời các yêu cầu nghiêm ngặt về độ chính xác, độ trễ thời gian thực và khả năng mở rộng dịch vụ, "
        "đồ án đã lựa chọn mô hình kiến trúc phân tán kết hợp giữa Thị giác máy tính hiện đại (InsightFace), "
        "Cơ sở dữ liệu Vector (Supabase pgvector) và Trợ lý ảo Tác tử RAG (LangChain Agent). "
        "Bảng 3.1 tổng hợp các quyết định kỹ thuật cốt lõi nhằm giải quyết bài toán đặt ra:"
    )

    # Table 3.1
    table_p = doc.add_paragraph()
    table_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_run = table_p.add_run("Bảng 3.1: Phân tích Lựa chọn Kỹ thuật để Đáp ứng Yêu cầu Hệ thống")
    t_run.bold = True
    t_run.italic = True
    t_run.font.size = Pt(10.5)

    table = doc.add_table(rows=6, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    headers = ["Quyết định Kỹ thuật", "Lý do Lựa chọn Công nghệ", "Đáp ứng Mục tiêu & Yêu cầu"]
    for idx, name in enumerate(headers):
        hdr[idx].text = name
        set_cell_background(hdr[idx], "1E3A8A")
        set_cell_margins(hdr[idx], top=120, bottom=120)
        p = hdr[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.bold = True
            r.font.size = Pt(10.5)
            r.font.color.rgb = RGBColor(255, 255, 255)

    data_tech = [
        ("Thị giác máy tính:\nInsightFace (buffalo_l)",
         "Kết hợp RetinaFace (FPN đa tỷ lệ) phát hiện 5 điểm mốc landmarks và ArcFace (ResNet-100) trích xuất vector 512D chuẩn hóa L2; tối ưu trên CPU bằng ONNX Runtime.",
         "Độ chính xác cao (>99%), triệt tiêu ảnh hưởng góc nghiêng và ánh sáng, tốc độ xử lý nhanh dưới 650ms trên CPU phổ thông."),
        ("Cơ sở dữ liệu Vector:\nSupabase pgvector (HNSW)",
         "Lập chỉ mục đồ thị phân tầng HNSW kết hợp toán tử Cosine Distance (<=>), cho phép truy vấn láng giềng gần nhất O(log N) trực tiếp trên PostgreSQL.",
         "Độ trễ truy vấn siêu tốc (2-5ms), đồng bộ nhất quán giữa dữ liệu sinh trắc học và dữ liệu nghiệp vụ quan hệ."),
        ("Trợ lý ảo thông minh:\nLangChain Agent + RAG",
         "Kết hợp truy xuất tri thức nội bộ từ tệp DOCX (RAG) và gọi công cụ nghiệp vụ thời gian thực (Tool Calling: tra cứu phòng trống, tính tiền, tạo đơn MoMo).",
         "Triệt tiêu ảo giác thông tin, hỗ trợ khách hàng đa ngôn ngữ 24/7, tự động hóa các thao tác giao dịch đặt phòng."),
        ("Backend Gateway:\nNode.js 20 & Express 4",
         "Kiến trúc Non-blocking I/O hướng sự kiện, tích hợp Zod validation, JWT Role-based Authorization và cổng thanh toán MoMo Sandbox.",
         "Xử lý hàng nghìn kết nối đồng thời với độ trễ thấp (<200ms), bảo mật đa tầng, dễ mở rộng microservices."),
        ("Frontend Giao diện:\nReact 18, Vite & Tailwind",
         "Kiến trúc Single Page Application (SPA), quản lý trạng thái tập trung với Zustand, thiết kế Responsive chuẩn Kiosk màn hình cảm ứng.",
         "Trải nghiệm người dùng mượt mà, giao diện hiện đại 5 sao, tương thích tốt với webcam máy tính và Kiosk.")
    ]

    for r_idx, row in enumerate(data_tech, start=1):
        cells = table.rows[r_idx].cells
        bg_col = "F8F9FA" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cells[c_idx].text = val
            set_cell_background(cells[c_idx], bg_col)
            set_cell_margins(cells[c_idx], top=100, bottom=100)
            p = cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(9.5)
                if c_idx == 0:
                    r.bold = True

    add_p(
        "Giải pháp kỹ thuật nêu trên vừa kế thừa sức mạnh của các mô hình học sâu tiên tiến nhất hiện nay, "
        "vừa đảm bảo tính khả thi cao khi có thể triển khai mượt mà hoàn toàn trên hạ tầng máy chủ CPU tiêu chuẩn, "
        "giúp tối ưu hóa chi phí đầu tư thiết bị cho doanh nghiệp khách sạn."
    )

    # Section 3.2
    add_h2("3.2 Thiết kế kiến trúc tổng thể")
    add_p(
        "Hệ thống được tổ chức theo mô hình Kiến trúc Hướng dịch vụ (Service-Oriented / Microservices Architecture) "
        "gồm 4 tầng chức năng độc lập, kết nối với nhau thông qua giao thức chuẩn RESTful API và cơ chế ủy quyền khóa bảo mật API Key:"
    )

    # Section 3.2.1
    add_h3("3.2.1 Sơ đồ khối kiến trúc hệ thống đa tầng")
    add_p(
        "Kiến trúc 4 tầng của hệ thống phân định rõ ràng trách nhiệm của từng thành phần, đảm bảo tính mô-đun hóa, "
        "khả năng mở rộng độc lập và tính sẵn sàng cao:"
    )
    add_bullet(
        "Tầng 1 - Giao diện người dùng (Client Presentation Layer): ",
        "Bao gồm Web Portal dành cho khách hàng đặt phòng và đăng ký khuôn mặt; Ứng dụng Kiosk Check-in tự phục vụ tích hợp camera; và Trang Quản trị (Admin Dashboard) dành cho lễ tân và ban quản lý khách sạn."
    )
    add_bullet(
        "Tầng 2 - Cổng nghiệp vụ và Điều phối (Backend API Gateway Layer): ",
        "Đóng vai trò trung tâm điều phối toàn bộ luồng thông tin: tiếp nhận yêu cầu từ Client, thực hiện kiểm tra quyền hạn JWT, kiểm soát tính hợp lệ của dữ liệu đầu vào bằng thư viện Zod, điều phối các giao dịch đặt phòng, buồng phòng, thanh toán MoMo và tương tác với cơ sở dữ liệu."
    )
    add_bullet(
        "Tầng 3 - Các dịch vụ Trí tuệ Nhân tạo chuyên biệt (AI Microservices Layer): ",
        "Bao gồm AI Face Service (FastAPI) chịu trách nhiệm giải mã ảnh, phát hiện khuôn mặt RetinaFace và sinh vector ArcFace 512D; cùng với AI Chatbot Service (FastAPI) vận hành LangChain Agent và quy trình RAG phân đoạn tri thức."
    )
    add_bullet(
        "Tầng 4 - Lưu trữ và Cơ sở dữ liệu đám mây (Data Persistence Layer): ",
        "Bao gồm hệ quản trị cơ sở dữ liệu Supabase PostgreSQL lưu trữ 10 bảng nghiệp vụ chuẩn hóa 3NF; tiện ích mở rộng pgvector hỗ trợ chỉ mục HNSW cho vector 512D và vector 768D; và Supabase Cloud Storage lưu trữ tệp ảnh chân dung an toàn."
    )

    # Insert Figure 3.2
    add_figure("system_architecture_diagram.png", "Hình 3.2: Sơ đồ khối kiến trúc hệ thống đa tầng (Microservices Architecture)")

    # Section 3.2.2
    add_h3("3.2.2 Sơ đồ luồng xử lý thời gian thực Check-in tự động")
    add_p(
        "Sơ đồ tuần tự (Sequence Diagram) mô tả chi tiết tiến trình tương tác thời gian thực giữa các thành phần "
        "khi khách hàng thực hiện nhận phòng tự động tại máy Kiosk:"
    )
    add_bullet(
        "Bước 1 và 2: ",
        "Khách hàng đứng trước camera Kiosk. Kiosk bắt khung hình từ webcam, tạo tệp nhị phân ảnh và gửi yêu cầu POST /embed đến AI Face Service."
    )
    add_bullet(
        "Bước 3 và 4: ",
        "AI Face Service căn chỉnh và trích xuất vector embedding 512 chiều chuẩn hóa L2, trả về cho Kiosk. Kiosk chuyển tiếp vector đến Backend qua endpoint POST /api/checkin/face-match."
    )
    add_bullet(
        "Bước 5 và 6: ",
        "Backend gửi truy vấn SQL tìm kiếm vector láng giềng gần nhất tới Supabase pgvector qua toán tử <=>. Nhờ chỉ mục HNSW, Supabase trả về Customer ID có độ tương đồng Cosine cao nhất trong vòng 3 mili-giây."
    )
    add_bullet(
        "Bước 7 và 8: ",
        "Backend kiểm tra độ tương đồng (≥ 0.75) và đối chiếu đơn đặt phòng hợp lệ trong ngày. Khi thỏa mãn, Backend cập nhật trạng thái đơn sang 'checked_in' và trạng thái phòng sang 'occupied' trong một giao dịch nguyên tử."
    )
    add_bullet(
        "Bước 9 và 10: ",
        "Backend phản hồi mã phòng và mã mở cửa PIN cho Kiosk. Kiosk hiển thị màn hình chúc mừng trang trọng mang tên khách hàng và in phiếu nhận phòng hoàn tất."
    )

    # Insert Figure 3.3
    add_figure("sequence_diagram_checkin.png", "Hình 3.3: Sơ đồ tuần tự (Sequence Diagram) xử lý nghiệp vụ Check-in bằng khuôn mặt tại Kiosk")

    # Section 3.3
    add_h2("3.3 Thiết kế các phân hệ và module phần mềm chính")

    # Section 3.3.1
    add_h3("3.3.1 Thiết kế Phân hệ Frontend (Web Portal, Kiosk & Admin Dashboard)")
    add_p(
        "Phân hệ Frontend được xây dựng trên nền tảng React 18, Vite và TailwindCSS, tổ chức theo cấu trúc mô-đun hướng tính năng (Feature-based Architecture):"
    )
    add_bullet(
        "Mô-đun Quản lý Trạng thái toàn cục (Zustand Stores): ",
        "Bao gồm authStore.ts (quản lý phiên đăng nhập, JWT token và thông tin người dùng), bookingStore.ts (lưu trữ thông tin phòng đã chọn, ngày lưu trú, dịch vụ kèm theo) và chatStore.ts (quản lý lịch sử tin nhắn và trạng thái đóng/mở của cửa sổ Chatbot)."
    )
    add_bullet(
        "Mô-đun Giao tiếp Dịch vụ API (Axios Clients): ",
        "Tập trung các tệp gọi API chuyên biệt: api.ts (gọi các dịch vụ phòng, đơn đặt phòng, hóa đơn của Backend Express), faceApi.ts (gọi trực tiếp AI Face Service để trích xuất vector khuôn mặt từ webcam) và chatApi.ts (gửi nhận tin nhắn với Chatbot Service)."
    )
    add_bullet(
        "Mô-đun Giao diện Khách hàng & Kiosk: ",
        "Bao gồm HomePage, RoomsPage, BookingPage, FaceRegistrationPage (tích hợp giao diện chụp webcam hỗ trợ khung tròn trợ thị) và KioskCheckinPage (tối ưu hóa cho màn hình cảm ứng tự phục vụ với phông chữ lớn và phản hồi tức thì)."
    )
    add_bullet(
        "Mô-đun Quản trị viên (Admin Pages): ",
        "Bao gồm ManageBookingsPage (sơ đồ buồng phòng trực quan theo màu sắc trạng thái, tiếp nhận check-in thủ công), ManageRoomsPage (cấu hình loại phòng và bảo trì) và AIComparisonPage (bảng đối soát trực tiếp hiệu năng nhận diện giữa ArcFace và FaceNet)."
    )

    # Section 3.3.2
    add_h3("3.3.2 Thiết kế Phân hệ Backend API Gateway & Business Logic")
    add_p(
        "Backend API được xây dựng bằng Node.js 20 và Express 4, áp dụng kiến trúc 3 tầng chuẩn mực (Controller - Service - Repository):"
    )
    add_bullet(
        "Tầng Controller: ",
        "Tiếp nhận yêu cầu HTTP, kiểm tra tính hợp lệ của tham số đầu vào bằng các lược đồ Zod (Validation Schema) và trả về định dạng phản hồi chuẩn hóa dạng ApiResponse gồm success, data và message."
    )
    add_bullet(
        "Tầng Service: ",
        "Hiện thực hóa toàn bộ logic nghiệp vụ khách sạn: faces.service.js (kiểm tra định dạng ảnh, gọi AI Service trích xuất vector, upload ảnh lên Supabase Storage và lưu trữ bản ghi khuôn mặt); checkin.service.js (điều phối quy trình đối sánh vector, kiểm tra điều kiện nhận phòng, cập nhật trạng thái phòng occupied và ghi log đối soát AI Model Comparison); bookings.service.js (xử lý đặt phòng, chống trùng lịch buồng phòng); và invoices.service.js (tính toán hóa đơn và tích hợp thanh toán MoMo Sandbox)."
    )
    add_bullet(
        "Tầng Repository: ",
        "Giao tiếp trực tiếp với cơ sở dữ liệu Supabase PostgreSQL thông qua thư viện client chính thức, tối ưu hóa các truy vấn SQL phức tạp và các câu lệnh tìm kiếm tương đồng vector."
    )

    # Section 3.3.3
    add_h3("3.3.3 Thiết kế Phân hệ AI Face Service")
    add_p(
        "Phân hệ AI Face Service được đóng gói thành dịch vụ vi mô độc lập chạy trên nền tảng Python FastAPI tại cổng 8000, "
        "đảm nhiệm các tác vụ thị giác máy tính nặng với 3 thành phần cốt lõi:"
    )
    add_bullet(
        "Cơ chế Khởi tạo Nạp trước (Lazy Load & Preload): ",
        "Mô hình FaceAnalysis thuộc gói buffalo_l được nạp vào bộ nhớ RAM ngay khi ứng dụng khởi động thông qua hàm get_face_app() trong app/services/face_detection.py, chuẩn bị sẵn sàng ngữ cảnh suy luận ctx_id=0 với kích thước phát hiện 640 × 640 pixel."
    )
    add_bullet(
        "Endpoint POST /embed: ",
        "Tiếp nhận tệp ảnh tải lên (Multipart form-data field 'image'), giải mã ảnh BGR qua OpenCV, phát hiện khuôn mặt bằng RetinaFace, kiểm tra điều kiện chất lượng (kích thước Bbox ≥ 80 × 80 px), căn chỉnh 5 điểm mốc và trích xuất vector ArcFace ResNet-100 gồm 512 số thực đã được chuẩn hóa L2."
    )
    add_bullet(
        "Endpoint POST /compare: ",
        "Tiếp nhận hai vector embedding 512 chiều dưới dạng mảng JSON, tính toán độ tương đồng Cosine Similarity theo công thức tích vô hướng rút gọn và trả về kết luận trùng khớp is_match dựa trên ngưỡng quy định."
    )

    # Section 3.3.4
    add_h3("3.3.4 Thiết kế Phân hệ AI Chatbot RAG Service")
    add_p(
        "Phân hệ Chatbot chạy trên nền tảng Python FastAPI tại cổng 8001, tích hợp Tác tử tự hành LangChain Agent và quy trình RAG chuyên sâu:"
    )
    add_bullet(
        "Mô-đun Xử lý Tài liệu & Phân đoạn Ngữ nghĩa (RAG Engine): ",
        "Gồm tệp docx_parser.py (đọc và phân tích cây cấu trúc tiêu đề, đoạn văn và bảng dữ liệu từ hotel_knowledge.docx) và chunker.py (tạo các đoạn tri thức tối đa 800 ký tự có độ gối đầu 120 ký tự, gán tiền tố ngữ cảnh và nhãn phân quyền access_scope: public hoặc admin_internal)."
    )
    add_bullet(
        "Mô-đun Truy xuất Tri thức Vector (retriever.py): ",
        "Chuyển đổi câu hỏi thành vector ngữ nghĩa 768 chiều và gọi thủ tục lưu trữ match_knowledge_chunks trên Supabase pgvector để trích xuất các đoạn văn bản có độ liên quan cao nhất làm ngữ cảnh chuẩn xác cho mô hình ngôn ngữ lớn (LLM)."
    )
    add_bullet(
        "Mô-đun Công cụ Nghiệp vụ Tác tử (Tool Calling): ",
        "Khai báo danh mục các công cụ chuyên biệt định nghĩa bằng bộ trang trí @tool trong hotel_tools.py, booking_tools.py, checkin_tools.py và maps_tools.py. Agent tự động phân tích câu hỏi người dùng và kích hoạt công cụ phù hợp để kết nối với Backend API truy vấn dữ liệu buồng phòng thực tế, tính toán tổng chi phí tiền phòng và tạo mã QR thanh toán ngân hàng trực tiếp trong cuộc hội thoại."
    )

    # Section 3.4
    add_h2("3.4 Thiết kế Cơ sở dữ liệu")
    add_p(
        "Cơ sở dữ liệu của hệ thống được xây dựng trên nền tảng Supabase PostgreSQL 15, tuân thủ nghiêm ngặt các quy tắc chuẩn hóa "
        "dữ liệu bậc 3 (3NF) nhằm đảm bảo tính toàn vẹn, loại bỏ dư thừa và tối ưu hóa hiệu năng truy vấn giao dịch."
    )

    # Section 3.4.1
    add_h3("3.4.1 Mô hình thực thể liên kết (ERD)")
    add_p(
        "Sơ đồ ERD thể hiện mối quan hệ ràng buộc khóa ngoại (Foreign Keys) giữa 10 bảng dữ liệu nghiệp vụ cốt lõi "
        "và các bảng lưu trữ vector tri thức RAG trong hệ thống:"
    )

    # Insert Figure 3.4
    add_figure("erd_diagram.png", "Hình 3.4: Sơ đồ quan hệ thực thể (ERD) cơ sở dữ liệu hệ thống trên Supabase PostgreSQL")

    # Section 3.4.2
    add_h3("3.4.2 Chi tiết các bảng dữ liệu cốt lõi trong hệ thống")
    add_p(
        "Cấu trúc các trường dữ liệu, kiểu dữ liệu và ý nghĩa nghiệp vụ của các bảng chính được đặc tả chi tiết như sau:"
    )

    def add_db_table(title, headers, rows):
        table_p = doc.add_paragraph()
        table_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        t_run = table_p.add_run(title)
        t_run.bold = True
        t_run.italic = True
        t_run.font.size = Pt(10)

        t = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = t.rows[0].cells
        for idx, h in enumerate(headers):
            hdr_cells[idx].text = h
            set_cell_background(hdr_cells[idx], "2B579A")
            set_cell_margins(hdr_cells[idx], top=80, bottom=80)
            p = hdr_cells[idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(255, 255, 255)

        for r_idx, row in enumerate(rows, start=1):
            cells = t.rows[r_idx].cells
            bg_col = "F8F9FA" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row):
                cells[c_idx].text = val
                set_cell_background(cells[c_idx], bg_col)
                set_cell_margins(cells[c_idx], top=70, bottom=70)
                p = cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(9)
        doc.add_paragraph()

    # Table 3.2: customers
    add_db_table(
        "Bảng 3.2: Đặc tả cấu trúc bảng thông tin khách hàng (customers)",
        ["Tên trường (Field)", "Kiểu dữ liệu (Data Type)", "Ràng buộc (Constraints)", "Ý nghĩa nghiệp vụ"],
        [
            ["id", "UUID", "PRIMARY KEY, DEFAULT gen_random_uuid()", "Mã định danh duy nhất của khách hàng"],
            ["user_id", "UUID", "FOREIGN KEY -> users(id), NULLABLE", "Liên kết với tài khoản đăng nhập (nếu có)"],
            ["full_name", "TEXT", "NOT NULL", "Họ và tên đầy đủ của khách hàng"],
            ["email", "TEXT", "NULLABLE", "Địa chỉ thư điện tử nhận hóa đơn và thông báo"],
            ["phone", "TEXT", "NOT NULL", "Số điện thoại liên lạc chính của khách"],
            ["identity_number", "TEXT", "NULLABLE", "Số CCCD hoặc số Hộ chiếu gốc"],
            ["is_active", "BOOLEAN", "DEFAULT TRUE", "Cờ trạng thái hoạt động (Xóa mềm)"],
            ["created_at", "TIMESTAMPTZ", "DEFAULT NOW()", "Thời điểm tạo hồ sơ khách hàng"]
        ]
    )

    # Table 3.3: face_profiles
    add_db_table(
        "Bảng 3.3: Đặc tả cấu trúc bảng hồ sơ sinh trắc học khuôn mặt (face_profiles)",
        ["Tên trường (Field)", "Kiểu dữ liệu (Data Type)", "Ràng buộc (Constraints)", "Ý nghĩa nghiệp vụ"],
        [
            ["id", "UUID", "PRIMARY KEY, DEFAULT gen_random_uuid()", "Mã định danh hồ sơ khuôn mặt"],
            ["customer_id", "UUID", "FOREIGN KEY -> customers(id), NOT NULL", "Tham chiếu khách hàng sở hữu khuôn mặt"],
            ["face_image_url", "TEXT", "NOT NULL", "Đường dẫn ảnh chân dung trên Supabase Storage"],
            ["face_embedding", "vector(512)", "NOT NULL, HNSW INDEXED", "Vector đặc trưng sinh trắc học ArcFace 512D chuẩn hóa L2"],
            ["confidence", "FLOAT", "NOT NULL", "Điểm số tin cậy phát hiện khuôn mặt RetinaFace"],
            ["model_version", "TEXT", "DEFAULT 'buffalo_l_arcface_r100'", "Phiên bản mô hình trí tuệ nhân tạo sử dụng"],
            ["is_active", "BOOLEAN", "DEFAULT TRUE", "Cờ trạng thái sử dụng hồ sơ khuôn mặt"]
        ]
    )

    # Table 3.4: bookings
    add_db_table(
        "Bảng 3.4: Đặc tả cấu trúc bảng đơn đặt phòng (bookings)",
        ["Tên trường (Field)", "Kiểu dữ liệu (Data Type)", "Ràng buộc (Constraints)", "Ý nghĩa nghiệp vụ"],
        [
            ["id", "UUID", "PRIMARY KEY, DEFAULT gen_random_uuid()", "Mã định danh đơn đặt phòng"],
            ["booking_code", "TEXT", "UNIQUE, NOT NULL", "Mã đơn hiển thị cho khách (VD: BK20261120001)"],
            ["customer_id", "UUID", "FOREIGN KEY -> customers(id), NOT NULL", "Khách hàng đứng tên đặt phòng"],
            ["room_id", "UUID", "FOREIGN KEY -> rooms(id), NOT NULL", "Phòng được phân bổ cho khách"],
            ["check_in_date", "DATE", "NOT NULL", "Ngày nhận phòng dự kiến"],
            ["check_out_date", "DATE", "NOT NULL", "Ngày trả phòng dự kiến"],
            ["room_price", "NUMERIC(12, 2)", "NOT NULL", "Giá phòng chụp tại thời điểm tạo đơn (Snapshot)"],
            ["status", "TEXT", "DEFAULT 'pending'", "Trạng thái: pending, confirmed, checked_in, checked_out..."],
            ["face_verification_status", "TEXT", "DEFAULT 'pending'", "Trạng thái xác thực khuôn mặt: verified, failed..."],
            ["actual_check_in_at", "TIMESTAMPTZ", "NULLABLE", "Thời điểm khách hàng nhận phòng thực tế"]
        ]
    )

    # Table 3.5: chat_knowledge_chunks
    add_db_table(
        "Bảng 3.5: Đặc tả cấu trúc bảng lưu trữ vector tri thức RAG (chat_knowledge_chunks)",
        ["Tên trường (Field)", "Kiểu dữ liệu (Data Type)", "Ràng buộc (Constraints)", "Ý nghĩa nghiệp vụ"],
        [
            ["id", "UUID", "PRIMARY KEY, DEFAULT gen_random_uuid()", "Mã định danh đoạn tri thức"],
            ["chunk_index", "INTEGER", "NOT NULL", "Thứ tự đoạn văn bản trong cẩm nang nghiệp vụ"],
            ["title", "TEXT", "NOT NULL", "Tiêu đề phân cấp chủ đề (Context Prefix)"],
            ["content", "TEXT", "NOT NULL", "Nội dung văn bản chi tiết trích xuất từ DOCX"],
            ["access_level", "TEXT", "DEFAULT 'public'", "Mức phân quyền truy cập: 'public' hoặc 'admin_internal'"],
            ["embedding", "vector(768)", "NOT NULL, HNSW INDEXED", "Vector ngữ nghĩa 768 chiều phục vụ tìm kiếm tương đồng"],
            ["created_at", "TIMESTAMPTZ", "DEFAULT NOW()", "Thời điểm đồng bộ tri thức vào cơ sở dữ liệu"]
        ]
    )

    # Section 3.4.3
    add_h3("3.4.3 Ràng buộc toàn vẹn và chiến lược an toàn dữ liệu")
    add_p(
        "Để bảo vệ dữ liệu nghiệp vụ và quyền riêng tư của khách hàng, hệ thống tuân thủ chặt chẽ các nguyên tắc an toàn dữ liệu:"
    )
    add_bullet(
        "Chiến lược Snapshot giá tại thời điểm giao dịch: ",
        "Mọi trường giá phòng (room_price) và giá dịch vụ (unit_price) đều được ghi nhận trực tiếp vào thời điểm giao dịch phát sinh, không dùng phép tham chiếu động tới bảng giá gốc, đảm bảo tính toàn vẹn kế toán độc lập với các đợt điều chỉnh giá sau này."
    )
    add_bullet(
        "Quy chuẩn kiểu dữ liệu tiền tệ chính xác: ",
        "Bắt buộc sử dụng kiểu dữ liệu NUMERIC(12, 2) cho toàn bộ các trường liên quan đến tiền tệ, thuế phí và thanh toán, ngăn chặn hoàn toàn sai số làm tròn số học thường gặp của kiểu FLOAT hoặc DOUBLE."
    )
    add_bullet(
        "Cơ chế Xóa mềm (Soft Delete): ",
        "Nghiêm cấm thao tác xóa vật lý (DELETE) đối với các bảng nghiệp vụ chính. Bổ sung trường is_active BOOLEAN DEFAULT TRUE để đánh dấu ngưng hoạt động khi cần, bảo tồn 100% lịch sử giao dịch phục vụ công tác kiểm toán và báo cáo."
    )
    add_bullet(
        "Bảo vệ dữ liệu sinh trắc học đa tầng: ",
        "Tách biệt hoàn toàn giữa kho lưu trữ ảnh chân dung (Supabase Storage bảo mật) và cơ sở dữ liệu quan hệ; vector embedding 512 chiều được mã hóa một chiều, không bao giờ được gửi về phía ứng dụng khách (Frontend), tuân thủ tiêu chuẩn quốc tế ISO 27001 và GDPR về bảo vệ dữ liệu cá nhân."
    )

    # Section 3.5 Conclusion
    add_h2("3.5 Kết luận Chương 3")
    add_p(
        "Chương 3 đã hoàn thành toàn diện công tác phân tích yêu cầu nghiệp vụ, lựa chọn giải pháp kỹ thuật, thiết kế kiến trúc hệ thống đa tầng "
        "và xây dựng mô hình cơ sở dữ liệu chi tiết cho Hệ thống Quản lý Khách sạn Thông minh Grand Luxury."
    )
    add_p(
        "Trước tiên, chương đã phân tích sâu sắc các yêu cầu chức năng và phi chức năng của 3 nhóm đối tượng người dùng, thể hiện qua Sơ đồ Use Case tổng quát "
        "và Bảng phân tích lựa chọn kỹ thuật tối ưu. Tiếp theo, kiến trúc tổng thể Microservices 4 tầng và Sơ đồ tuần tự tương tác thời gian thực "
        "đã làm rõ sự phân tách trách nhiệm mạch lạc giữa Frontend React 18, Backend Express Gateway, AI Face Service InsightFace, "
        "AI Chatbot RAG Service LangChain và nền tảng dữ liệu đám mây Supabase PostgreSQL."
    )
    add_p(
        "Bên cạnh đó, thiết kế chi tiết từng mô-đun phần mềm và lược đồ cơ sở dữ liệu 10 bảng chuẩn hóa 3NF tích hợp kiểu dữ liệu vector không gian cao chiều "
        "(vector 512D và vector 768D với chỉ mục HNSW) đã tạo nên một bộ tài liệu kỹ thuật hoàn chỉnh, chặt chẽ và nhất quán. "
        "Đây chính là tiền đề then chốt để tiến hành xây dựng, cài đặt và thực nghiệm đánh giá toàn bộ hệ thống trong Chương 4."
    )

    # Save to output path
    doc.save(output_path)
    print("✅ Successfully generated Chapter 3 DOCX at:", output_path)


if __name__ == "__main__":
    create_chapter_3_document(DOCX_OUTPUT_PATH)
