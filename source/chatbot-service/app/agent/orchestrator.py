import re
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from app.core.config import settings
from app.core.logger import logger
from app.rag.retriever import KnowledgeRetriever
from app.agent.prompts import GRAND_LUXURY_SYSTEM_PROMPT
from app.tools.context import current_jwt_token, current_user_id, current_user_role
from app.tools.hotel_tools import search_available_rooms, get_room_details, get_room_pricing
from app.tools.booking_tools import create_booking_request, confirm_booking_request
from app.tools.checkin_tools import get_checkin_eligibility, prepare_face_checkin
from app.tools.maps_tools import (
    search_place,
    search_restaurants_or_cafes,
    get_directions,
    suggest_day_itinerary,
    suggest_dynamic_itinerary,
)
from app.tools.admin_tools import (
    get_admin_dashboard_stats,
    get_admin_ai_comparison_stats,
)

BASE_TOOLS = [
    search_available_rooms,
    get_room_details,
    get_room_pricing,
    create_booking_request,
    confirm_booking_request,
    get_checkin_eligibility,
    prepare_face_checkin,
    search_place,
    search_restaurants_or_cafes,
    get_directions,
    suggest_dynamic_itinerary,
    suggest_day_itinerary,
]

ADMIN_TOOLS = [
    get_admin_dashboard_stats,
    get_admin_ai_comparison_stats,
]

ALL_TOOLS = BASE_TOOLS + ADMIN_TOOLS
TOOL_MAP = {t.name: t for t in ALL_TOOLS}




class AgentOrchestrator:
    """Orchestrates RAG retrieval, history management, LangChain Tools, and OpenAI LLM."""

    def __init__(self):
        self.retriever = KnowledgeRetriever()
        self._llm: Optional[ChatOpenAI] = None

    def _get_llm(self) -> ChatOpenAI:
        if not self._llm:
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is not configured in settings or .env.")
            self._llm = ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model=settings.OPENAI_CHAT_MODEL,
                temperature=0.3,
                max_retries=2,
                timeout=25.0,
            )
        return self._llm

    def process_message(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        user_id: Optional[str] = None,
        role: str = "customer",
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Processes user message with RAG context, LangChain Tool Calling, and OpenAI LLM."""
        history = history or []
        target_scope = "admin_internal" if role == "admin" else "public"

        # 1. Set ContextVars for tools execution
        current_jwt_token.set(token)
        current_user_id.set(user_id)
        current_user_role.set(role)

        # 2. RAG Retrieval from pgvector
        retrieved_chunks = []
        try:
            retrieved_chunks = self.retriever.search(
                query=message,
                target_scope=target_scope,
                match_threshold=0.40,
                match_count=4,
            )
        except Exception as e:
            logger.warning(f"RAG retrieval skipped or failed: {e}")

        # 3. Format context
        if retrieved_chunks:
            context_blocks = []
            for chunk in retrieved_chunks:
                title = chunk.get("section_title", "Thông tin")
                content = chunk.get("chunk_content", "")
                context_blocks.append(f"【{title}】\n{content}")
            context_str = "\n\n".join(context_blocks)
        else:
            context_str = "Không tìm thấy đoạn trích phù hợp trong tài liệu khách sạn."

        # 4. Assemble system prompt and history messages
        today_str = datetime.now().strftime("%Y-%m-%d")
        current_year = str(datetime.now().year)
        system_instruction = GRAND_LUXURY_SYSTEM_PROMPT.format(
            current_date=today_str,
            current_year=current_year,
            context=context_str,
        )
        messages = [SystemMessage(content=system_instruction)]

        # Add recent history (up to last 10 messages)
        recent_history = history[-10:] if len(history) > 10 else history
        for item in recent_history:
            role_type = item.get("role", "user")
            content = item.get("content", "")
            if not content:
                continue
            if role_type in ("assistant", "ai"):
                messages.append(AIMessage(content=content))
            else:
                messages.append(HumanMessage(content=content))

        # Add current user message
        messages.append(HumanMessage(content=message))

        # 5. Invoke LLM with Tool Calling (enable Admin tools if role == 'admin')
        active_tools = ALL_TOOLS if role == "admin" else BASE_TOOLS
        llm = self._get_llm()
        llm_with_tools = llm.bind_tools(active_tools)

        ui_type = "text"
        ui_payload = None

        try:
            logger.info(f"Invoking OpenAI LLM ({settings.OPENAI_CHAT_MODEL}) with {len(active_tools)} tools (role={role})...")
            ai_response = llm_with_tools.invoke(messages)

            # Check if LLM requested tool execution
            if hasattr(ai_response, "tool_calls") and ai_response.tool_calls:
                logger.info(f"LLM triggered {len(ai_response.tool_calls)} tool calls: {[tc['name'] for tc in ai_response.tool_calls]}")
                messages.append(ai_response)

                for tool_call in ai_response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    tool_fn = TOOL_MAP.get(tool_name)

                    if tool_fn:
                        if tool_name == "search_available_rooms":
                            # If LLM didn't pass room_type_name, infer from user message
                            if not tool_args.get("room_type_name"):
                                msg_l = message.lower()
                                if "suite thương gia" in msg_l or "thương gia" in msg_l or "executive" in msg_l:
                                    tool_args["room_type_name"] = "Suite thương gia"
                                elif "suite nhỏ" in msg_l or "junior" in msg_l:
                                    tool_args["room_type_name"] = "Suite nhỏ"
                                elif "đặc biệt sang trọng" in msg_l or "president" in msg_l:
                                    tool_args["room_type_name"] = "Phòng đặc biệt sang trọng"
                                elif "sang trọng" in msg_l or "luxury" in msg_l:
                                    tool_args["room_type_name"] = "Phòng sang trọng"
                                elif "cao cấp" in msg_l or "deluxe" in msg_l:
                                    tool_args["room_type_name"] = "Phòng cao cấp"
                                elif "tiêu chuẩn" in msg_l or "standard" in msg_l:
                                    tool_args["room_type_name"] = "Phòng tiêu chuẩn"
                                elif "suite" in msg_l:
                                    tool_args["room_type_name"] = "Suite"

                        if tool_name == "search_restaurants_or_cafes":
                            # Ensure limit is up to 20
                            current_limit = tool_args.get("limit") or 20
                            tool_args["limit"] = max(10, min(int(current_limit), 20))

                            # Clean/refine keyword if LLM passed empty or generic keyword
                            current_kw = str(tool_args.get("keyword") or "").strip().lower()
                            if not current_kw or current_kw in ["quán ăn", "nhà hàng", "ẩm thực"]:
                                extracted_kw = self._extract_food_keyword(message)
                                if extracted_kw and extracted_kw != "quán ăn":
                                    tool_args["keyword"] = extracted_kw
                                    logger.info(f"Refined search_restaurants_or_cafes keyword to: '{extracted_kw}'")

                            # Automatically extract previously mentioned places from history
                            seen_places = self._extract_previous_places(history)
                            existing_exclude = tool_args.get("exclude_ids") or []
                            if isinstance(existing_exclude, str):
                                existing_exclude = [s.strip() for s in re.split(r"[,;\n|]", existing_exclude) if s.strip()]
                            elif not isinstance(existing_exclude, list):
                                existing_exclude = []

                            combined_exclude = list(set(existing_exclude + seen_places))
                            if combined_exclude:
                                tool_args["exclude_ids"] = combined_exclude
                                logger.info(f"Injecting exclude_ids into search_restaurants_or_cafes: {combined_exclude}")

                        if tool_name in ("suggest_day_itinerary", "suggest_dynamic_itinerary"):
                            # Auto-extract destination and days if LLM omitted or defaulted incorrectly
                            msg_l = message.lower()
                            if "destination" not in tool_args or not tool_args.get("destination") or tool_args.get("destination") == "Đà Nẵng":
                                if "quảng bình" in msg_l or "phong nha" in msg_l or "đồng hới" in msg_l:
                                    tool_args["destination"] = "Quảng Bình"
                                elif "huế" in msg_l:
                                    tool_args["destination"] = "Huế"
                                elif "hội an" in msg_l:
                                    tool_args["destination"] = "Hội An"
                                elif "hà giang" in msg_l:
                                    tool_args["destination"] = "Hà Giang"
                                elif "nha trang" in msg_l:
                                    tool_args["destination"] = "Nha Trang"
                                elif "phú quốc" in msg_l:
                                    tool_args["destination"] = "Phú Quốc"

                            if "days" not in tool_args or not tool_args.get("days"):
                                day_match = re.search(r"(\d+)\s*(ngày|day)", msg_l)
                                if day_match:
                                    tool_args["days"] = int(day_match.group(1))

                        logger.info(f"Executing tool '{tool_name}' with args: {tool_args}")

                        tool_res = tool_fn.invoke(tool_args)
                        logger.info(f"Tool '{tool_name}' output success: {tool_res.get('success', False)}")
                        if not tool_res.get("success", False):
                            logger.warning(
                                f"Tool '{tool_name}' returned FAILURE: error={tool_res.get('error')}, "
                                f"status_code={tool_res.get('status_code')}, backend_body={tool_res.get('backend_body')}"
                            )

                        # Map structured UI type and payload
                        if tool_name == "search_available_rooms" and tool_res.get("success"):
                            ui_type = "room_list"
                            ui_payload = tool_res
                            room_count = len(tool_res.get("rooms", []))
                            if room_count > 0:
                                reply_text = (
                                    f"Grand Luxury xin gửi Quý khách danh sách {room_count} phòng còn trống phù hợp với yêu cầu. "
                                    f"Quý khách vui lòng tham khảo các thẻ phòng bên dưới và nhấn 'Đặt phòng này ngay' để tiến hành đặt:"
                                )
                            else:
                                reply_text = (
                                    "Rất tiếc, hiện tại không còn phòng nào phù hợp với yêu cầu của Quý khách "
                                    "trong khoảng thời gian này. Quý khách vui lòng chọn ngày khác hoặc liên hệ Lễ tân qua hotline (+84) 236 3888 999."
                                )
                        elif tool_name == "create_booking_request" and tool_res.get("success"):
                            ui_type = "booking_preview"
                            ui_payload = tool_res.get("preview")
                        elif tool_name == "confirm_booking_request":
                            if tool_res.get("success"):
                                ui_type = "payment_card"
                                booking_data = tool_res.get("booking") or {}
                                payment_data = tool_res.get("payment") or {}
                                pay_url = tool_res.get("payment_url") or payment_data.get("payUrl")
                                total_amount = (
                                    booking_data.get("room_subtotal")
                                    or (booking_data.get("room_price", 0) * (booking_data.get("number_of_nights") or 1))
                                    or payment_data.get("amount")
                                    or 0
                                )
                                ui_payload = {
                                    "booking_code": booking_data.get("booking_code") or "BK-PENDING",
                                    "total_amount": total_amount,
                                    "pay_url": pay_url,
                                    "booking": booking_data,
                                    "payment": payment_data,
                                }
                                reply_text = (
                                    f"Đơn đặt phòng {booking_data.get('booking_code', '')} đã được tạo thành công! "
                                    f"Quý khách vui lòng kiểm tra thông tin và nhấn nút 'Thanh toán qua PayPal' bên dưới để hoàn tất."
                                )
                            else:
                                ui_type = "text"
                                ui_payload = None
                                reply_text = tool_res.get("message") or f"Không thể hoàn tất đặt phòng: {tool_res.get('error', 'Lỗi không xác định')}"
                        elif tool_name == "prepare_face_checkin":
                            if tool_res.get("success"):
                                ui_type = "checkin_card"
                                ui_payload = tool_res
                                reply_text = (
                                    f"Grand Luxury đã kích hoạt hệ thống Camera AI nhận diện khuôn mặt cho đơn {tool_res.get('booking_code', '')}. "
                                    f"Quý khách vui lòng hướng mặt vào giữa khung hình và nhấn 'Chụp & Xác thực' bên dưới để hoàn tất nhận phòng:"
                                )
                            else:
                                ui_type = "text"
                                ui_payload = None
                                reply_text = tool_res.get("message") or "Không thể kích hoạt Camera AI check-in."
                        elif tool_name == "get_checkin_eligibility":
                            # If eligible and user clearly asked to check-in now, we can activate camera
                            if tool_res.get("can_checkin") and any(
                                k in message.lower() for k in ["checkin", "check-in", "nhận phòng", "làm thủ tục", "quét mặt", "bắt đầu"]
                            ):
                                ui_type = "checkin_card"
                                ui_payload = {
                                    "success": True,
                                    "booking_id": tool_res.get("booking_id"),
                                    "booking_code": tool_res.get("booking_code"),
                                    "room_number": tool_res.get("room_number"),
                                    "room_type": tool_res.get("room_type"),
                                }
                                reply_text = (
                                    f"Grand Luxury xác nhận đơn {tool_res.get('booking_code', '')} (Phòng {tool_res.get('room_number', '')}) "
                                    f"đã sẵn sàng nhận phòng! Hệ thống đã bật Camera AI, Quý khách vui lòng nhấn 'Chụp & Xác thực' để nhận phòng:"
                                )
                            else:
                                reply_text = tool_res.get("message") or "Đã kiểm tra điều kiện nhận phòng của Quý khách."
                        elif tool_name in ("search_place", "search_restaurants_or_cafes"):
                            if tool_res.get("success"):
                                ui_type = "place_card"
                                ui_payload = tool_res.get("ui_payload") or tool_res
                                p_count = len(tool_res.get("places", []))
                                if tool_name == "search_restaurants_or_cafes" and p_count > 0:
                                    reply_text = (
                                        f"Grand Luxury xin gửi Quý khách danh sách {p_count} quán ẩm thực nổi bật gần khách sạn:"
                                    )
                        elif tool_name == "get_directions":

                            if tool_res.get("success"):
                                ui_type = "directions_card"
                                ui_payload = tool_res
                        elif tool_name in ("suggest_day_itinerary", "suggest_dynamic_itinerary"):
                            if tool_res.get("success"):
                                ui_type = "itinerary_card"
                                ui_payload = tool_res
                        elif tool_name == "get_admin_dashboard_stats":
                            if tool_res.get("success"):
                                ui_type = "admin_stats_card"
                                ui_payload = tool_res
                                reply_text = "Grand Luxury xin gửi Quản trị viên báo cáo tổng quan tình hình kinh doanh và công suất phòng:"
                            else:
                                ui_type = "text"
                                ui_payload = None
                                reply_text = tool_res.get("error") or "Không thể lấy số liệu thống kê quản trị từ Backend."
                        elif tool_name == "get_admin_ai_comparison_stats":
                            if tool_res.get("success"):
                                ui_type = "admin_ai_comparison_card"
                                ui_payload = tool_res
                                reply_text = "Dưới đây là kết quả phân tích so sánh hiệu năng giữa hai mô hình FaceNet và InsightFace:"
                            else:
                                ui_type = "text"
                                ui_payload = None
                                reply_text = tool_res.get("error") or "Không thể lấy thông số so sánh AI từ Backend."



                        # Append ToolMessage
                        messages.append(
                            ToolMessage(
                                content=json.dumps(tool_res, ensure_ascii=False),
                                tool_call_id=tool_call["id"],
                            )
                        )

                # Get final conversational response from LLM synthesizing tool outputs
                try:
                    final_response = llm.invoke(messages)
                    if hasattr(final_response, "content") and final_response.content:
                        raw_c = final_response.content.strip()
                        # UI-First rule: If a visual Card is rendered, only take the first short lead-in sentence
                        if ui_type != "text":
                            first_line = raw_c.split('\n')[0].strip()
                            if first_line and len(first_line) < 120 and not any(first_line.startswith(p) for p in ["-", "*", "1.", "•"]):
                                reply_text = first_line
                        else:
                            reply_text = raw_c
                except Exception as fe:
                    logger.warning(f"Error during LLM final response synthesis: {fe}")
                    # Keep pre-set reply_text


            else:
                reply_text = ai_response.content if hasattr(ai_response, "content") else str(ai_response)

                # Fallback interceptor for dining / food questions:
                # If LLM didn't call tool but user asked about dining, BBQ, restaurants, cafe or follow-up
                msg_l = message.lower()
                reply_l = reply_text.lower()
                is_asking_other = any(
                    w in msg_l for w in ["khác", "thêm", "nữa", "mới", "đổi quán", "quán khác", "chỗ khác", "còn quán", "còn không"]
                )
                is_food_context = any(
                    w in msg_l for w in ["quán", "ăn", "nướng", "lẩu", "hải sản", "cafe", "cà phê", "nhà hàng", "uống", "món", "ẩm thực", "bbq", "bánh tráng", "mì quảng", "cơm"]
                ) or any(
                    w in reply_l for w in ["quán nướng", "quán ăn", "nhà hàng", "hải sản", "quán cafe", "cà phê", "quán lẩu"]
                )

                if not is_food_context and is_asking_other and history:
                    for h in reversed(history[-4:]):
                        h_content = str(h.get("content", "")).lower()
                        if any(w in h_content for w in ["quán", "nướng", "hải sản", "bếp cuốn", "bé mặn", "nhà hàng", "ẩm thực", "cafe", "mì quảng", "lẩu"]):
                            is_food_context = True
                            break

                if is_food_context:
                    logger.info("Auto-intercepting dining/food query in Python: invoking search_restaurants_or_cafes...")
                    seen_places = self._extract_previous_places(history)

                    # Dynamic keyword extraction from current message or past history
                    kw = self._extract_food_keyword(message)
                    if not kw or kw == "quán ăn":
                        # Look into recent history for the actual food keyword
                        if history:
                            for h in reversed(history[-4:]):
                                h_kw = self._extract_food_keyword(str(h.get("content", "")))
                                if h_kw and h_kw != "quán ăn":
                                    kw = h_kw
                                    break
                    if not kw or kw == "quán ăn":
                        # Look into reply text if LLM mentioned specific food
                        if "nướng" in reply_l or "bbq" in reply_l:
                            kw = "quán nướng"
                        elif "lẩu gà" in reply_l:
                            kw = "lẩu gà"
                        elif "hải sản" in reply_l:
                            kw = "hải sản"
                        elif "cafe" in reply_l or "cà phê" in reply_l:
                            kw = "quán cafe"
                        else:
                            kw = "quán ăn"

                    tool_res = search_restaurants_or_cafes.invoke({
                        "keyword": kw,
                        "limit": 20,
                        "exclude_ids": seen_places if is_asking_other else [],
                    })

                    if tool_res.get("success") and tool_res.get("places"):
                        ui_type = "place_card"
                        ui_payload = tool_res.get("ui_payload") or tool_res
                        places_count = len(tool_res.get("places", []))
                        reply_text = (
                            f"Grand Luxury xin gửi Quý khách danh sách {places_count} quán {kw} nổi bật gần khách sạn:"
                        )


        except Exception as e:
            logger.error(f"Error during OpenAI LLM invocation: {type(e).__name__} - {str(e)}")
            import traceback
            traceback.print_exc()

            if ui_type == "payment_card":
                reply_text = (
                    "Đơn đặt phòng của Quý khách đã được tạo thành công! "
                    "Quý khách vui lòng nhấn nút 'Thanh toán qua PayPal' bên dưới để thanh toán tiền phòng."
                )
            elif ui_type == "checkin_card":
                reply_text = (
                    "Hệ thống đã kích hoạt camera nhận diện khuôn mặt. "
                    "Quý khách vui lòng hướng mặt vào khung hình và nhấn 'Chụp & Xác thực' bên dưới để nhận phòng:"
                )
            elif ui_type == "place_card":
                reply_text = "Dưới đây là thông tin địa điểm và gợi ý trải nghiệm phù hợp với yêu cầu của Quý khách:"
            elif ui_type == "directions_card":
                reply_text = "Dưới đây là thông tin lộ trình và bản đồ chỉ đường từ Khách sạn Grand Luxury:"
            elif ui_type == "itinerary_card":
                reply_text = "Grand Luxury xin gợi ý lịch trình 1 ngày trải nghiệm trọn vẹn dành cho Quý khách:"
            elif ui_type == "room_list":
                reply_text = "Grand Luxury xin gửi Quý khách danh sách phòng còn trống phù hợp:"


            else:
                reply_text = (
                    "Xin lỗi Quý khách, hiện tại hệ thống kết nối AI đang quá tải hoặc gặp sự cố. "
                    "Quý khách vui lòng thử lại sau ít phút hoặc liên hệ trực tiếp Lễ tân qua hotline (+84) 236 3888 999."
                )

        # UI-First Text Sanitization: If visual Card is rendered, ensure reply_text is at most 1 short sentence
        if ui_type != "text" and reply_text:
            clean_text = re.sub(r'!\[.*?\]\(.*?\)', '', reply_text)
            clean_text = re.sub(r'<[^>]+>', '', clean_text).strip()
            lines = [ln.strip() for ln in clean_text.split('\n') if ln.strip()]
            first_line = lines[0] if lines else ""

            if len(first_line) > 130 or any(first_line.startswith(prefix) for prefix in ["-", "*", "1.", "2.", "•"]):
                default_prompts = {
                    "room_list": "Dưới đây là các phòng còn trống phù hợp với yêu cầu của Quý khách:",
                    "place_card": "Dưới đây là các quán ăn và địa điểm nổi bật gần khách sạn:",
                    "directions_card": "Dưới đây là lộ trình và bản đồ chỉ đường từ khách sạn:",
                    "itinerary_card": "Grand Luxury xin gửi Quý khách lịch trình gợi ý 1 ngày trải nghiệm:",
                    "booking_preview": "Dưới đây là thông tin xem trước đơn đặt phòng của Quý khách:",
                    "payment_card": "Đơn đặt phòng đã được tạo thành công! Quý khách vui lòng thanh toán qua thẻ bên dưới:",
                    "checkin_card": "Hệ thống đã sẵn sàng Camera AI, Quý khách vui lòng nhấn 'Chụp & Xác thực' bên dưới:",
                    "admin_stats_card": "Dưới đây là báo cáo tổng quan tình hình kinh doanh và công suất phòng của khách sạn:",
                    "admin_ai_comparison_card": "Dưới đây là bảng phân tích so sánh chi tiết hiệu năng giữa FaceNet và InsightFace:",
                }
                reply_text = default_prompts.get(ui_type, "Dưới đây là kết quả dành cho Quý khách:")
            else:
                reply_text = first_line
        elif reply_text:
            reply_text = re.sub(r'!\[.*?\]\(.*?\)', '', reply_text).strip()


        # 6. Determine smart suggested actions
        suggested_actions = self._generate_suggested_actions(message, reply_text, ui_type)

        return {
            "reply": reply_text,
            "ui_type": ui_type,
            "ui_payload": ui_payload,
            "suggested_actions": suggested_actions,
            "context_chunks_count": len(retrieved_chunks),
        }

    @staticmethod
    def _generate_suggested_actions(message: str, reply: str, ui_type: str = "text") -> List[str]:
        if ui_type == "admin_stats_card":
            return ["Công suất phòng hôm nay", "So sánh mô hình AI FaceNet vs InsightFace", "Doanh thu tháng này"]
        if ui_type == "admin_ai_comparison_card":
            return ["Báo cáo doanh thu hôm nay", "Chạy benchmark AI", "Tỷ lệ đồng thuận Agreement Rate"]
        if ui_type == "room_list":
            return ["Xem chi tiết phòng đầu tiên", "Tôi muốn đặt phòng này", "Chính sách hủy phòng"]
        if ui_type == "booking_preview":
            return ["Xác nhận đặt phòng", "Đổi ngày nhận phòng", "Chọn phòng khác"]
        if ui_type in ("booking_confirmed", "payment_card"):
            return ["Thanh toán ngay qua PayPal", "Xem đơn đặt phòng của tôi", "Chính sách hủy phòng"]
        if ui_type == "checkin_card":
            return ["Chụp lại ảnh", "Xem thông tin phòng", "Hỗ trợ từ Lễ tân"]
        if ui_type == "place_card":
            return ["Chỉ đường từ khách sạn đến đây", "Gợi ý quán ăn gần đây", "Lên lịch trình 1 ngày"]
        if ui_type == "directions_card":
            return ["Quán ăn ngon gần điểm đến", "Địa điểm tham quan lân cận", "Lên lịch trình 1 ngày"]
        if ui_type == "itinerary_card":
            return ["Chỉ đường điểm đầu tiên", "Quán hải sản ngon buổi tối", "Đặt xe đi Bà Nà / Hội An"]

        msg_lower = message.lower()
        if any(k in msg_lower for k in ["phòng", "room", "giá", "trống"]):
            return ["Tìm phòng trống ngày 20/11 đến 22/11", "Các hạng phòng", "Chính sách hủy phòng"]
        if any(k in msg_lower for k in ["checkin", "check-in", "nhận phòng", "khuôn mặt"]):
            return ["Tôi muốn nhận phòng ngay", "Kiểm tra điều kiện check-in", "Hướng dẫn đăng ký khuôn mặt"]
        if any(k in msg_lower for k in ["đường", "chỉ đường", "khoảng cách", "đi từ"]):
            return ["Chỉ đường đi Bà Nà Hills", "Chỉ đường đi Phố cổ Hội An", "Chỉ đường đến Cầu Rồng"]
        if any(k in msg_lower for k in ["ăn", "quán", "hải sản", "cafe", "cà phê", "mì quảng"]):
            return ["Gợi ý quán hải sản ngon gần đây", "Quán cafe view biển đẹp", "Bánh tráng cuốn thịt heo ngon"]
        if any(k in msg_lower for k in ["lịch trình", "itinerary", "tour", "đi đâu", "chơi gì"]):
            return ["Lịch trình 1 ngày cho gia đình", "Lịch trình khám phá Hội An", "Địa điểm chụp ảnh đẹp"]
        if any(k in msg_lower for k in ["du lịch", "đà nẵng", "hội an", "bà nà", "sơn trà"]):
            return ["Gợi ý quán ăn ngon", "Chỉ đường đến Hội An", "Lịch trình 1 ngày"]
        return ["Kiểm tra phòng trống", "Bảng giá phòng nghỉ", "Giờ check-in / check-out"]

    @staticmethod
    def _extract_food_keyword(text: str) -> str:
        """Trích xuất từ khóa món ăn hoặc loại quán từ câu hỏi của người dùng."""
        if not text:
            return "quán ăn"
        t = text.lower().strip()

        # Kiểm tra các loại món ăn đặc trưng phổ biến
        specialties = [
            ("lẩu gà", "lẩu gà"),
            ("lẩu bò", "lẩu bò"),
            ("lẩu", "quán lẩu"),
            ("quán nướng", "quán nướng"),
            ("nướng bơ", "quán nướng"),
            ("nướng", "quán nướng"),
            ("bbq", "quán nướng bbq"),
            ("hải sản", "hải sản"),
            ("bánh tráng cuốn", "bánh tráng cuốn"),
            ("bánh tráng", "bánh tráng cuốn"),
            ("mì quảng", "mì quảng"),
            ("bún chả cá", "bún chả cá"),
            ("bún mắm", "bún mắm"),
            ("cơm niêu", "cơm niêu"),
            ("cơm gà", "cơm gà"),
            ("chè sầu", "chè sầu"),
            ("chè", "quán chè"),
            ("cafe", "quán cafe"),
            ("cà phê", "quán cà phê"),
            ("quán chay", "cơm chay"),
            ("chay", "quán chay"),
        ]
        for key, kw in specialties:
            if key in t:
                return kw

        # Loại bỏ các từ thừa, từ nối
        clean = t
        patterns_to_remove = [
            r"gợi ý cho tôi", r"gợi ý giúp tôi", r"gợi ý giúp", r"gợi ý",
            r"tìm giúp tôi", r"tìm cho tôi", r"tìm kiếm", r"tìm",
            r"có quán nào", r"có chỗ nào", r"quán nào", r"chỗ nào",
            r"ngon không", r"ngon gần đây", r"gần đây không", r"gần đây",
            r"gần khách sạn", r"quanh đây", r"ngon rẻ", r"ngon",
            r"cho tôi", r"giúp tôi", r"ở đà nẵng", r"tại đà nẵng", r"đà nẵng",
            r"còn không", r"nào khác không", r"khác không", r"nhé", r"với", r"ạ",
        ]
        for pat in patterns_to_remove:
            clean = re.sub(pat, "", clean, flags=re.IGNORECASE)

        clean = re.sub(r"\s+", " ", clean).strip()
        if len(clean) >= 2:
            return clean
        return "quán ăn"

    @staticmethod
    def _extract_previous_places(history: Optional[List[Dict[str, Any]]]) -> List[str]:
        """Trích xuất danh sách tên quán ăn / địa điểm đã từng được gợi ý trong lịch sử hội thoại."""
        seen: List[str] = []
        if not history:
            return seen
        try:
            from app.tools.maps_tools import RESTAURANTS_AND_CAFES_DB
            for item in history:
                content = str(item.get("content", "")).lower()
                for r in RESTAURANTS_AND_CAFES_DB:
                    name = r["name"]
                    if name.lower() in content and name not in seen:
                        seen.append(name)
                    # Kiểm tra tên rút gọn (VD: 'Bé Mặn', 'Năm Đảnh', 'Bà Rô')
                    short_name = name.replace("Hải sản ", "").replace("Nhà hàng ", "").replace("Đặc sản ", "").replace("Quán ", "").strip()
                    if len(short_name) >= 4 and short_name.lower() in content and name not in seen:
                        seen.append(name)
        except Exception as e:
            logger.warning(f"Error extracting previous places: {e}")
        return seen


