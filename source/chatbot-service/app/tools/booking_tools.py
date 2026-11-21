import re
import json
import traceback
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
from langchain_core.tools import tool
from app.core.config import settings
from app.core.logger import logger
from app.tools.context import current_jwt_token


def is_valid_uuid(val: str) -> bool:
    """Checks whether a string is a standard 36-char UUID."""
    if not val or not isinstance(val, str):
        return False
    uuid_pattern = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
        re.IGNORECASE,
    )
    return bool(uuid_pattern.match(val.strip()))


def resolve_room_id(room_identifier: str) -> Optional[str]:
    """Resolves room_identifier to UUID.
    
    If room_identifier is already a valid UUID, returns it.
    If it's a room number (e.g. '704', 'Phòng 704'), queries Backend API GET /api/rooms?search=...
    """
    if not room_identifier:
        return None
    raw = str(room_identifier).strip()
    if is_valid_uuid(raw):
        return raw

    clean_search = re.sub(r"^(phòng|room)\s*", "", raw, flags=re.IGNORECASE).strip()
    logger.info(f"Resolving room identifier '{raw}' -> searching room '{clean_search}' via Backend API...")

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                f"{settings.BACKEND_API_URL}/api/rooms",
                params={"search": clean_search},
            )
            if resp.status_code == 200:
                res_data = resp.json().get("data", [])
                if isinstance(res_data, list) and len(res_data) > 0:
                    for r in res_data:
                        if str(r.get("room_number", "")).strip().lower() == clean_search.lower():
                            logger.info(f"Found exact match for room '{clean_search}': UUID={r.get('id')}")
                            return r.get("id")
                    first_match = res_data[0].get("id")
                    logger.info(f"Using first match for room '{clean_search}': UUID={first_match}")
                    return first_match
            else:
                logger.warning(f"Backend search rooms returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Error resolving room_id from '{room_identifier}': {e}")
        traceback.print_exc()
    return None


@tool
def create_booking_request(
    room_id: str,
    room_name: str,
    check_in_date: str,
    check_out_date: str,
    number_of_guests: int = 1,
    price_per_night: float = 0,
    note: Optional[str] = None,
) -> Dict[str, Any]:
    """Tạo bảng xem trước (preview) đơn đặt phòng để khách hàng kiểm tra thông tin và xác nhận trước khi chốt đơn.
    
    Args:
        room_id: UUID của phòng khách muốn đặt hoặc số phòng.
        room_name: Tên phòng hoặc số phòng (Ví dụ: "Phòng 101 - Deluxe Ocean").
        check_in_date: Ngày nhận phòng YYYY-MM-DD.
        check_out_date: Ngày trả phòng YYYY-MM-DD.
        number_of_guests: Số lượng khách lưu trú.
        price_per_night: Giá phòng mỗi đêm (VND).
        note: Ghi chú đặc biệt của khách nếu có.
    """
    logger.info(f"Tool create_booking_request: room_id={room_id}, dates={check_in_date} -> {check_out_date}")
    try:
        resolved_id = resolve_room_id(room_id) or room_id

        d_in = datetime.strptime(check_in_date, "%Y-%m-%d")
        d_out = datetime.strptime(check_out_date, "%Y-%m-%d")
        nights = max(1, (d_out - d_in).days)
        total_amount = nights * price_per_night

        preview_data = {
            "room_id": resolved_id,
            "room_name": room_name,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "number_of_nights": nights,
            "number_of_guests": number_of_guests,
            "price_per_night": price_per_night,
            "total_amount": total_amount,
            "formatted_total": f"{total_amount:,.0f} VNĐ",
            "note": note or "Không có",
        }

        return {
            "success": True,
            "requires_confirmation": True,
            "preview": preview_data,
            "message": f"Quý khách vui lòng kiểm tra lại thông tin đơn đặt {room_name} và xác nhận để hoàn tất chốt đơn.",
        }
    except Exception as e:
        logger.error(f"Lỗi create_booking_request: {e}")
        traceback.print_exc()
        return {"success": False, "error": f"Lỗi tính toán đặt phòng: {str(e)}"}


@tool
def confirm_booking_request(
    room_id: str,
    check_in_date: str,
    check_out_date: str,
    number_of_guests: int = 1,
    note: Optional[str] = None,
) -> Dict[str, Any]:
    """Chốt đơn đặt phòng chính thức bằng cách gọi API Backend và tự động khởi tạo liên kết thanh toán MoMo.
    
    Args:
        room_id: UUID của phòng đã chọn hoặc số phòng (Ví dụ: "704").
        check_in_date: Ngày nhận phòng YYYY-MM-DD.
        check_out_date: Ngày trả phòng YYYY-MM-DD.
        number_of_guests: Số khách lưu trú.
        note: Ghi chú đơn đặt.
    """
    logger.info(
        f"[confirm_booking_request] Invoked with args: room_id={room_id}, "
        f"check_in_date={check_in_date}, check_out_date={check_out_date}, "
        f"number_of_guests={number_of_guests}, note={note}"
    )

    token = current_jwt_token.get()
    if not token:
        logger.error("[confirm_booking_request] FAILED: Thiếu JWT Bearer token (user chưa đăng nhập hoặc token không được truyền)")
        return {
            "success": False,
            "error_code": "AUTH_REQUIRED",
            "message": "Quý khách cần đăng nhập tài khoản trước khi thực hiện chốt đơn đặt phòng.",
        }

    token_preview = token[:10] + "..." if len(token) > 10 else "present"
    logger.info(f"[confirm_booking_request] JWT Token validated (preview: {token_preview})")

    # Auto resolve room_id if it's a room number instead of UUID
    resolved_id = resolve_room_id(room_id)
    if not resolved_id:
        logger.error(f"[confirm_booking_request] FAILED: Không thể tìm thấy UUID cho room_id='{room_id}'")
        return {
            "success": False,
            "error": f"Không tìm thấy thông tin phòng tương ứng với '{room_id}'. Quý khách vui lòng chọn lại phòng.",
        }
    logger.info(f"[confirm_booking_request] Resolved room UUID: {resolved_id}")

    # Parse and validate number_of_guests as integer
    try:
        guests_count = int(number_of_guests)
        if guests_count <= 0:
            guests_count = 1
    except (ValueError, TypeError):
        guests_count = 1

    # Format payload strictly complying with Backend createBookingSchema:
    # { room_id: UUID, check_in_date: YYYY-MM-DD, check_out_date: YYYY-MM-DD, number_of_guests: int, note?: string }
    payload = {
        "room_id": str(resolved_id).strip(),
        "check_in_date": str(check_in_date).strip(),
        "check_out_date": str(check_out_date).strip(),
        "number_of_guests": guests_count,
    }

    # Only include note if non-empty string; omit entirely otherwise to satisfy Zod .optional() (rejects null)
    if note and str(note).strip() and str(note).strip().lower() not in ("none", "null", "không có", "undefined"):
        payload["note"] = str(note).strip()

    logger.info(f"[confirm_booking_request] Sending POST {settings.BACKEND_API_URL}/api/bookings with payload: {json.dumps(payload, ensure_ascii=False)}")

    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{settings.BACKEND_API_URL}/api/bookings",
                json=payload,
                headers=headers,
            )

            # Check response status
            if resp.status_code not in (200, 201):
                logger.error(
                    f"Backend rejected booking: Status={resp.status_code}, Body={resp.text}"
                )
                try:
                    res_json = resp.json()
                    err_msg = (
                        res_json.get("error", {}).get("message")
                        or res_json.get("message")
                        or resp.text
                    )
                except Exception:
                    err_msg = resp.text
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "error": err_msg,
                    "backend_body": resp.text,
                }

            # Response 200/201
            res_json = resp.json()
            if not res_json.get("success"):
                logger.error(
                    f"Backend returned status {resp.status_code} but success is False: Body={resp.text}"
                )
                err_msg = res_json.get("error", {}).get("message") or "Không thể tạo đơn đặt phòng"
                return {"success": False, "error": err_msg, "backend_body": resp.text}

            booking = res_json.get("data")
            logger.info(f"Đặt phòng thành công: booking_code={booking.get('booking_code')}, id={booking.get('id')}")

            # Automatically initiate PayPal payment link
            payment_info = None
            payment_url = None
            try:
                logger.info(f"[confirm_booking_request] Initiating PayPal payment for booking_id={booking['id']}...")
                pay_resp = client.post(
                    f"{settings.BACKEND_API_URL}/api/payments",
                    json={"booking_id": booking["id"], "gateway": "paypal"},
                    headers=headers,
                )
                logger.info(f"[confirm_booking_request] Payment API status={pay_resp.status_code}, body={pay_resp.text}")
                if pay_resp.status_code in (200, 201):
                    pay_json = pay_resp.json()
                    if pay_json.get("success"):
                        payment_info = pay_json.get("data")
                        payment_url = payment_info.get("payUrl") if payment_info else None
                        logger.info(f"Khởi tạo thanh toán PayPal thành công: payUrl={payment_url}")
                else:
                    logger.warning(f"Backend payments API rejected: Status={pay_resp.status_code}, Body={pay_resp.text}")
            except Exception as pe:
                logger.warning(f"Lỗi khi gọi API payments: {pe}")
                traceback.print_exc()

            return {
                "success": True,
                "booking": booking,
                "payment": payment_info,
                "payment_url": payment_url,
                "message": (
                    f"Đặt phòng thành công! Mã đơn của Quý khách là {booking.get('booking_code')}. "
                    f"Trạng thái: Chờ thanh toán. "
                    f"Vui lòng nhấn nút 'Thanh toán qua PayPal' bên dưới để hoàn tất."
                ),
            }

    except Exception as e:
        logger.error(f"Exception during confirm_booking_request: {e}")
        traceback.print_exc()
        return {"success": False, "error": f"Lỗi kết nối Backend: {str(e)}"}
