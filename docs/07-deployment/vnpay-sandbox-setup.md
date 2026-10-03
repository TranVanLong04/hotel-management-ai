# Hướng Dẫn Đăng Ký và Cấu Hình Cổng Thanh Toán VNPay Sandbox

Tài liệu này hướng dẫn chi tiết các bước đăng ký tài khoản thử nghiệm (Sandbox) tại cổng thanh toán VNPay, lấy thông tin xác thực và cấu hình vào hệ thống Hotel Management AI.

---

## 1. Đăng ký tài khoản Sandbox VNPay

1. Truy cập trang đăng ký đối tác thử nghiệm VNPay:
   👉 **[https://sandbox.vnpayment.vn/devreg/](https://sandbox.vnpayment.vn/devreg/)**

2. Điền đầy đủ các thông tin theo biểu mẫu:
   - **Họ và tên**: Tên của bạn / Quản trị viên
   - **Email**: Email thật để nhận thông tin TMN Code và Secret Key
   - **Số điện thoại**: SĐT nhận mã xác thực
   - **Tên doanh nghiệp/Website**: Khách sạn AI / Hotel Management AI
   - **Mục đích**: Tích hợp thanh toán đồ án / thử nghiệm

3. Sau khi bấm **Đăng ký**, VNPay sẽ gửi email kích hoạt và thông tin cấu hình merchant về email của bạn (thường mất 1 - 5 phút).

---

## 2. Lấy thông tin xác thực (Credentials)

Mở email từ VNPay Sandbox (tiêu đề thường là *VNPay - Thông tin kết nối môi trường TEST / Sandbox*), bạn sẽ nhận được 2 thông số quan trọng:

| Tên thông số | Mô tả | Ví dụ thực tế |
|---|---|---|
| **Terminal ID / Mã định danh (vnp_TmnCode)** | Mã Merchant do VNPay cấp | `2QXUI4J4`, `COCOS001`... |
| **Secret Key / Khóa bí mật (vnp_HashSecret)** | Chuỗi ký tự bảo mật dùng để băm HMAC-SHA512 | `RAOCTPBNKGIQGCRVPGZCQYUZENYGSZLQ`... |

> [!WARNING]
> Không chia sẻ chuỗi `vnp_HashSecret` công khai trên Git repository hoặc log hệ thống.

---

## 3. Cập nhật file cấu hình `.env`

Mở file `source/backend/.env` trên máy cục bộ của bạn và cập nhật 2 trường sau:

```env
# ============================================================================
# CỔNG THANH TOÁN VNPAY (SANDBOX)
# ============================================================================
VNPAY_TMN_CODE=DIEN_TMN_CODE_THUC_TE_TU_EMAIL_VNPAY
VNPAY_HASH_SECRET=DIEN_SECRET_KEY_THUC_TE_TU_EMAIL_VNPAY
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/payment/vnpay/callback
```

> [!NOTE]
> Sau khi cập nhật `.env`, **Nodemon** sẽ tự động restart backend server (hoặc bạn có thể restart thủ công). Frontend sẽ tự động nhận diện VNPay đã khả dụng và mở khóa phương thức thanh toán VNPay trên giao diện.

---

## 4. Thông tin Thẻ Test VNPay Sandbox

Khi thanh toán trên giao diện cổng VNPay Sandbox, chọn **Thẻ nội địa / Tài khoản ngân hàng** và sử dụng thông tin thẻ test mẫu dưới đây:

### Ngân hàng thử nghiệm NCB:
- **Ngân hàng**: NCB
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày phát hành**: `07/15`
- **Mật khẩu OTP**: `123456`

---

## 5. Quy trình kiểm tra (Verification Flow)

1. Đăng nhập vào website: `http://localhost:5173/rooms`
2. Chọn phòng và tiến hành đặt phòng
3. Tại trang `/payment/:bookingId`, kiểm tra nút **Cổng Thanh Toán VNPAY-QR** đã sáng (Active)
4. Chọn VNPay và bấm **Thanh toán ngay**
5. Hệ thống chuyển hướng sang VNPay Sandbox, nhập thông tin thẻ test NCB ở trên
6. Nhập OTP `123456` và xác nhận
7. VNPay chuyển hướng về `/payment/vnpay/callback` -> Thông báo thành công và chuyển sang bước quét khuôn mặt `/face-register`.
