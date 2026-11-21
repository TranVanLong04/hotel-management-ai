import re
import traceback
from typing import Dict, Any, Optional
import httpx
from langchain_core.tools import tool
from app.core.config import settings
from app.core.logger import logger
from app.tools.context import current_jwt_token


def is_valid_uuid(val: str) -> bool:
    """Kiểm tra chuỗi có phải UUID 36 ký tự hay không."""
    if not val or not isinstance(val, str):
        return False
    uuid_pattern = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
        re.IGNORECASE,
    )
    return bool(uuid_pattern.match(val.strip()))


@tool
def get_checkin_eligibility(booking_id: Optional[str] = None) -> Dict[str, Any]:
    """Kiểm tra điều kiện check-in bằng khuôn mặt AI của khách hàng.

    Kiểm tra xem khách hàng hiện tại có:
    1. Đã đăng ký hồ sơ khuôn mặt trên hệ thống chưa.
    2. Có đơn đặt phòng nào đang ở trạng thái 'confirmed' (đã thanh toán/xác nhận) để check-in hay không.

    Args:
        booking_id: Tùy chọn - UUID hoặc mã booking cụ thể (VD: 'BK20261114001') nếu khách muốn check-in cho đơn chỉ định.
    """
    token = current_jwt_token.get()
    if not token:
        return {
            "success": False,
            "can_checkin": False,
            "error": "AUTH_REQUIRED",
            "message": "Quý khách cần đăng nhập tài khoản để thực hiện thủ tục nhận phòng (Check-in).",
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    has_face_profile = False
    face_profile_data = None
    try:
        with httpx.Client(timeout=10.0) as client:
            # 1. Kiểm tra hồ sơ khuôn mặt
            face_resp = client.get(f"{settings.BACKEND_API_URL}/api/faces/me", headers=headers)
            if face_resp.status_code == 200:
                face_json = face_resp.json()
                if face_json.get("success"):
                    has_face_profile = True
                    face_profile_data = face_json.get("data")
                    logger.info("Face profile check: Customer has active face profile.")
            else:
                logger.info(f"Face profile check: No active face profile (Status {face_resp.status_code})")

            # 2. Lấy danh sách booking của khách hàng
            bookings_resp = client.get(f"{settings.BACKEND_API_URL}/api/bookings", headers=headers)
            if bookings_resp.status_code != 200:
                logger.error(f"Failed to fetch bookings: Status={bookings_resp.status_code}, Body={bookings_resp.text}")
                return {
                    "success": False,
                    "can_checkin": False,
                    "has_face_profile": has_face_profile,
                    "error": "BOOKINGS_FETCH_FAILED",
                    "message": "Không thể truy xuất thông tin đặt phòng của Quý khách. Vui lòng thử lại sau.",
                }

            bookings_json = bookings_resp.json()
            bookings = bookings_json.get("data", [])
            if not isinstance(bookings, list) or len(bookings) == 0:
                return {
                    "success": True,
                    "can_checkin": False,
                    "has_face_profile": has_face_profile,
                    "message": "Quý khách chưa có đơn đặt phòng nào trên hệ thống. Quý khách có muốn tìm và đặt phòng ngay bây giờ không?",
                }

            # Tìm booking mục tiêu
            target_booking = None
            if booking_id:
                clean_id = str(booking_id).strip()
                for b in bookings:
                    if b.get("id") == clean_id or str(b.get("booking_code", "")).lower() == clean_id.lower():
                        target_booking = b
                        break

            if not target_booking:
                # Ưu tiên booking 'confirmed', sau đó 'pending_payment', 'pending', 'checked_in'
                confirmed_list = [b for b in bookings if b.get("status") == "confirmed"]
                if confirmed_list:
                    target_booking = confirmed_list[0]
                else:
                    # Lấy booking mới nhất
                    target_booking = bookings[0]

            b_id = target_booking.get("id")
            b_code = target_booking.get("booking_code", "BK-UNKNOWN")
            b_status = target_booking.get("status")
            room_info = target_booking.get("rooms") or {}
            room_number = room_info.get("room_number") or target_booking.get("room_number") or "N/A"
            room_type = (room_info.get("room_types") or {}).get("name") or "Phòng khách sạn"

            # Đánh giá điều kiện check-in
            if b_status == "checked_in":
                return {
                    "success": True,
                    "can_checkin": False,
                    "has_face_profile": has_face_profile,
                    "booking_id": b_id,
                    "booking_code": b_code,
                    "room_number": room_number,
                    "status": b_status,
                    "message": f"Đơn đặt phòng {b_code} (Phòng {room_number}) đã hoàn tất thủ tục nhận phòng trước đó. Chúc Quý khách có kỳ nghỉ tuyệt vời!",
                }

            if b_status != "confirmed":
                status_vn = {
                    "pending_payment": "chờ thanh toán",
                    "pending": "chờ khách sạn xác nhận",
                    "cancelled": "đã hủy",
                }.get(b_status, b_status)
                return {
                    "success": True,
                    "can_checkin": False,
                    "has_face_profile": has_face_profile,
                    "booking_id": b_id,
                    "booking_code": b_code,
                    "room_number": room_number,
                    "status": b_status,
                    "message": f"Đơn đặt phòng {b_code} hiện đang ở trạng thái '{status_vn}'. Quý khách cần thanh toán và được xác nhận trước khi thực hiện nhận phòng.",
                }

            if not has_face_profile:
                return {
                    "success": True,
                    "can_checkin": False,
                    "has_face_profile": False,
                    "booking_id": b_id,
                    "booking_code": b_code,
                    "room_number": room_number,
                    "status": b_status,
                    "message": f"Đơn đặt phòng {b_code} (Phòng {room_number} - {room_type}) đã được xác nhận. Tuy nhiên, Quý khách chưa đăng ký hồ sơ khuôn mặt AI. Quý khách vui lòng vào mục Hồ sơ cá nhân để chụp ảnh đăng ký khuôn mặt, hoặc ghé quầy Lễ tân để check-in trực tiếp.",
                }

            # Đủ điều kiện check-in!
            return {
                "success": True,
                "can_checkin": True,
                "has_face_profile": True,
                "booking_id": b_id,
                "booking_code": b_code,
                "room_number": room_number,
                "room_type": room_type,
                "status": b_status,
                "message": f"Đơn đặt phòng {b_code} (Phòng {room_number} - {room_type}) đã sẵn sàng nhận phòng. Quý khách đã có hồ sơ khuôn mặt hợp lệ trên hệ thống.",
            }

    except Exception as e:
        logger.error(f"Error checking check-in eligibility: {e}")
        traceback.print_exc()
        return {
            "success": False,
            "can_checkin": False,
            "error": str(e),
            "message": "Đã xảy ra lỗi khi kiểm tra thông tin nhận phòng. Quý khách vui lòng liên hệ Lễ tân qua hotline (+84) 236 3888 999.",
        }


@tool
def prepare_face_checkin(booking_id: str, booking_code: Optional[str] = None) -> Dict[str, Any]:
    """Kích hoạt giao diện Camera AI quét khuôn mặt để khách hàng check-in tự phục vụ qua Chatbot.

    Gọi tool này khi khách hàng đủ điều kiện check-in và muốn tiến hành nhận phòng.

    Args:
        booking_id: UUID của đơn đặt phòng cần check-in.
        booking_code: Mã hiển thị đơn đặt phòng (VD: 'BK20261114001').
    """
    clean_id = str(booking_id).strip()
    return {
        "success": True,
        "booking_id": clean_id,
        "booking_code": booking_code or "BK-CURRENT",
        "message": "Hệ thống đã sẵn sàng camera AI. Quý khách vui lòng cho phép truy cập Camera để xác thực khuôn mặt nhận phòng.",
    }

