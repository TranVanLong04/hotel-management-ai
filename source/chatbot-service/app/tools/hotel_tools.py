from typing import Dict, Any, Optional
from datetime import datetime
import httpx
from langchain_core.tools import tool
from app.core.config import settings
from app.core.logger import logger


def filter_rooms_by_type(rooms: list, query: str) -> list:
    """Lọc danh sách phòng theo loại phòng một cách chính xác."""
    if not query or not query.strip():
        return rooms

    q = query.strip().lower()
    noise_words = {"phòng", "hạng", "loại", "room", "các", "những", "cho", "cần", "tìm", "đặt", "xem"}
    words = [w for w in q.split() if w not in noise_words]
    clean_q = " ".join(words) if words else q

    filtered = []
    for r in rooms:
        r_name = r.get("room_type_name", "").lower()
        r_desc = r.get("description", "").lower()
        full_text = f"{r_name} {r_desc}"

        # 1. Match cụm từ trực tiếp (Ví dụ: "suite thương gia" in "phòng suite thương gia")
        if clean_q in r_name or clean_q in full_text:
            filtered.append(r)
            continue

        # 2. Match tất cả từ khóa (Ví dụ: cả 'suite' và 'thương gia' đều xuất hiện)
        if words and all(w in full_text for w in words):
            filtered.append(r)
            continue

        # 3. Match từ khóa tiếng Anh tương ứng
        if "deluxe" in clean_q and ("cao cấp" in r_name or "deluxe" in r_name):
            filtered.append(r)
        elif "standard" in clean_q and ("tiêu chuẩn" in r_name or "standard" in r_name):
            filtered.append(r)
        elif "junior" in clean_q and ("suite nhỏ" in r_name or "junior" in r_name):
            filtered.append(r)
        elif "executive" in clean_q and ("thương gia" in r_name or "executive" in r_name):
            filtered.append(r)

    return filtered


@tool
def search_available_rooms(
    check_in: str,
    check_out: str,
    guests: int = 1,
    room_type_name: Optional[str] = None,
    room_type_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Tìm kiếm danh sách phòng trống thực tế trong khoảng thời gian nhận và trả phòng.
    
    Args:
        check_in: Ngày nhận phòng theo định dạng YYYY-MM-DD (Ví dụ: 2026-11-20). Mặc định sử dụng năm hiện tại.
        check_out: Ngày trả phòng theo định dạng YYYY-MM-DD (Ví dụ: 2026-11-22). Mặc định sử dụng năm hiện tại.
        guests: Số lượng khách lưu trú (mặc định là 1).
        room_type_name: Tên hoặc từ khóa loại phòng khách muốn tìm (Ví dụ: 'Suite thương gia', 'Suite nhỏ', 'Deluxe', 'Standard', 'Phòng cao cấp', 'Phòng tiêu chuẩn').
        room_type_id: UUID của loại phòng nếu khách có yêu cầu cụ thể (tùy chọn).
    """
    logger.info(
        f"Tool search_available_rooms: check_in={check_in}, check_out={check_out}, "
        f"guests={guests}, room_type_name={room_type_name}, room_type_id={room_type_id}"
    )
    params = {
        "check_in": check_in,
        "check_out": check_out,
        "guests": guests,
    }
    if room_type_id:
        params["room_type_id"] = room_type_id

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{settings.BACKEND_API_URL}/api/rooms/available", params=params)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                formatted_rooms = []
                for room in data:
                    rt = room.get("room_types") or {}
                    rt_name = rt.get("name") or "Standard Room"
                    desc = room.get("description") or ""
                    formatted_rooms.append({
                        "id": room.get("id"),
                        "room_number": room.get("room_number"),
                        "floor": room.get("floor"),
                        "description": desc,
                        "room_type_id": room.get("room_type_id"),
                        "room_type_name": rt_name,
                        "price_per_night": float(rt.get("base_price") or 800000),
                        "max_guests": rt.get("max_guests") or 2,
                        "amenities": rt.get("amenities") or "Wi-Fi, TV, Điều hòa, Minibar",
                        "image_url": rt.get("image_url") or "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
                    })

                # Filter by room_type_name if specified
                if room_type_name and room_type_name.strip():
                    formatted_rooms = filter_rooms_by_type(formatted_rooms, room_type_name)

                return {
                    "success": True,
                    "check_in": check_in,
                    "check_out": check_out,
                    "guests": guests,
                    "filtered_by_type": room_type_name,
                    "total_available": len(formatted_rooms),
                    "rooms": formatted_rooms,
                }
            else:
                err_msg = resp.json().get("error", {}).get("message", "Không thể tìm phòng")
                return {"success": False, "error": err_msg, "rooms": []}
    except Exception as e:
        logger.error(f"Lỗi khi gọi API search_available_rooms: {e}")
        return {"success": False, "error": f"Lỗi kết nối Backend: {str(e)}", "rooms": []}


@tool
def get_room_details(room_id: str) -> Dict[str, Any]:
    """Lấy thông tin chi tiết của một phòng cụ thể theo UUID phòng.
    
    Args:
        room_id: UUID của phòng cần xem chi tiết.
    """
    logger.info(f"Tool get_room_details: room_id={room_id}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{settings.BACKEND_API_URL}/api/rooms/{room_id}")
            if resp.status_code == 200:
                return {"success": True, "room": resp.json().get("data")}
            return {"success": False, "error": "Không tìm thấy thông tin phòng"}
    except Exception as e:
        logger.error(f"Lỗi khi gọi API get_room_details: {e}")
        return {"success": False, "error": str(e)}


@tool
def get_room_pricing(price_per_night: float, check_in: str, check_out: str) -> Dict[str, Any]:
    """Tính toán số đêm lưu trú và tổng tiền dự kiến từ ngày nhận và ngày trả phòng.
    
    Args:
        price_per_night: Giá niêm yết một đêm (VND).
        check_in: Ngày nhận phòng YYYY-MM-DD.
        check_out: Ngày trả phòng YYYY-MM-DD.
    """
    try:
        d_in = datetime.strptime(check_in, "%Y-%m-%d")
        d_out = datetime.strptime(check_out, "%Y-%m-%d")
        nights = (d_out - d_in).days
        if nights <= 0:
            return {"success": False, "error": "Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm."}

        total_amount = nights * price_per_night
        return {
            "success": True,
            "number_of_nights": nights,
            "price_per_night": price_per_night,
            "total_amount": total_amount,
            "formatted_total": f"{total_amount:,.0f} VNĐ",
        }
    except Exception as e:
        return {"success": False, "error": f"Sai định dạng ngày: {str(e)}"}

