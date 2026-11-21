import traceback
from typing import Dict, Any, Optional
import httpx
from langchain_core.tools import tool
from app.core.config import settings
from app.core.logger import logger
from app.tools.context import current_jwt_token, current_user_role


@tool
def get_admin_dashboard_stats() -> Dict[str, Any]:
    """Lấy dữ liệu thống kê tổng quan quản trị khách sạn: doanh thu hôm nay, doanh thu tháng này, số phòng, tỷ lệ lấp đầy, số đơn hôm nay.
    Chỉ dành riêng cho tài khoản Quản trị viên (Admin).
    """
    token = current_jwt_token.get()
    role = current_user_role.get()

    logger.info(f"Tool get_admin_dashboard_stats called by role='{role}' (has_token={bool(token)})")

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(
                f"{settings.BACKEND_API_URL}/api/reports/dashboard",
                headers=headers,
            )

            if resp.status_code == 200:
                res_json = resp.json()
                dashboard_data = res_json.get("data", {})
                logger.info("Successfully fetched admin dashboard stats from Backend API.")
                
                raw_bookings_today = dashboard_data.get("bookings_today", {})
                if isinstance(raw_bookings_today, dict):
                    bookings_today_count = raw_bookings_today.get("total", 0)
                    bookings_today_stats = raw_bookings_today
                else:
                    bookings_today_count = int(raw_bookings_today or 0)
                    bookings_today_stats = {
                        "total": bookings_today_count,
                        "pending": 0,
                        "confirmed": 0,
                        "checked_in": 0,
                        "checked_out": 0,
                        "cancelled": 0,
                    }

                return {
                    "success": True,
                    "dashboard": dashboard_data,
                    "rooms": dashboard_data.get("rooms", {}),
                    "bookings_today": bookings_today_count,
                    "bookings_by_status": bookings_today_stats,
                    "revenue_today": dashboard_data.get("revenue_today", 0),
                    "revenue_this_month": dashboard_data.get("revenue_this_month", 0),
                    "occupancy_rate": dashboard_data.get("occupancy_rate", 0),
                    "new_customers_this_month": dashboard_data.get("new_customers_this_month", 0),
                }

            logger.warning(
                f"Backend /api/reports/dashboard rejected: status={resp.status_code}, body={resp.text}"
            )
            return {
                "success": False,
                "status_code": resp.status_code,
                "error": f"Lỗi lấy số liệu dashboard từ Backend: {resp.text}",
            }

    except Exception as e:
        logger.error(f"Exception during get_admin_dashboard_stats: {e}")
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Lỗi kết nối Backend API: {str(e)}",
        }


@tool
def get_admin_ai_comparison_stats(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    dataset_tag: Optional[str] = None,
) -> Dict[str, Any]:
    """Lấy số liệu phân tích và so sánh giữa hai mô hình nhận diện khuôn mặt AI: FaceNet (Inception-ResNet-v1) và InsightFace (ArcFace buffalo_l).
    Bao gồm: Accuracy, EER (Equal Error Rate), FMR, FNMR, Độ trễ suy luận (Latency) và Tỷ lệ đồng thuận (Agreement Rate).
    Chỉ dành riêng cho tài khoản Quản trị viên (Admin).

    Args:
        date_from: Thời gian bắt đầu (ISO string hoặc YYYY-MM-DD), tùy chọn.
        date_to: Thời gian kết thúc (ISO string hoặc YYYY-MM-DD), tùy chọn.
        dataset_tag: Nhãn bộ dữ liệu (VD: 'benchmark', 'curated', 'manual'), tùy chọn.
    """
    token = current_jwt_token.get()
    role = current_user_role.get()

    logger.info(f"Tool get_admin_ai_comparison_stats called by role='{role}' (has_token={bool(token)})")

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    params = {}
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to
    if dataset_tag:
        params["dataset_tag"] = dataset_tag

    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(
                f"{settings.BACKEND_API_URL}/api/ai-comparison/stats",
                headers=headers,
                params=params,
            )

            if resp.status_code == 200:
                res_json = resp.json()
                raw_stats = res_json.get("data", {})
                overview = raw_stats.get("overview", {})
                facenet_raw = raw_stats.get("facenet", {})
                insightface_raw = raw_stats.get("insightface", {})

                total_runs = overview.get("totalRuns", 0)
                agreement_count = overview.get("agreementCount", 0)
                agreement_rate = (
                    round((agreement_count / total_runs) * 100, 2)
                    if total_runs > 0
                    else 100.0
                )

                # Lọc gọn dữ liệu: LOẠI BỎ rocCurve (hàng trăm điểm) và discrepancyList (hàng chục record ảnh/URL nặng)
                # Chỉ giữ lại các chỉ số cốt lõi: EER, Accuracy, FMR, FNMR, Latency, Overview
                facenet_stats = {
                    "name": facenet_raw.get("name", "FaceNet (Inception-ResNet-v1)"),
                    "accuracy": facenet_raw.get("accuracy"),
                    "eer": facenet_raw.get("eer"),
                    "fmr": facenet_raw.get("fmr"),
                    "fnmr": facenet_raw.get("fnmr"),
                    "threshold": facenet_raw.get("threshold", 0.75),
                    "avgInferenceTimeMs": facenet_raw.get("avgInferenceTimeMs", 0),
                    "p95InferenceTimeMs": facenet_raw.get("p95InferenceTimeMs", 0),
                    "avgTotalTimeMs": facenet_raw.get("avgTotalTimeMs", 0),
                }

                insightface_stats = {
                    "name": insightface_raw.get("name", "InsightFace (ArcFace buffalo_l)"),
                    "accuracy": insightface_raw.get("accuracy"),
                    "eer": insightface_raw.get("eer"),
                    "fmr": insightface_raw.get("fmr"),
                    "fnmr": insightface_raw.get("fnmr"),
                    "threshold": insightface_raw.get("threshold", 0.55),
                    "avgInferenceTimeMs": insightface_raw.get("avgInferenceTimeMs", 0),
                    "p95InferenceTimeMs": insightface_raw.get("p95InferenceTimeMs", 0),
                    "avgTotalTimeMs": insightface_raw.get("avgTotalTimeMs", 0),
                }

                compact_overview = {
                    "totalRuns": total_runs,
                    "totalFacesTested": overview.get("totalFacesTested", 0),
                    "genuineCount": overview.get("genuineCount", 0),
                    "impostorCount": overview.get("impostorCount", 0),
                    "agreementCount": agreement_count,
                    "discrepancyCount": overview.get("discrepancyCount", 0),
                    "agreementRate": agreement_rate,
                }

                logger.info(f"Successfully fetched & compacted AI comparison stats (totalRuns={total_runs}, agreementRate={agreement_rate}%).")

                # Trả về payload gọn gàng (dưới 1KB thay vì 46KB)
                return {
                    "success": True,
                    "agreement_rate": agreement_rate,
                    "overview": compact_overview,
                    "facenet": facenet_stats,
                    "insightface": insightface_stats,
                }

            logger.warning(
                f"Backend /api/ai-comparison/stats rejected: status={resp.status_code}, body={resp.text}"
            )
            return {
                "success": False,
                "status_code": resp.status_code,
                "error": f"Lỗi lấy thông số AI comparison: {resp.text}",
            }

    except Exception as e:
        logger.error(f"Exception during get_admin_ai_comparison_stats: {e}")
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Lỗi kết nối Backend API: {str(e)}",
        }

