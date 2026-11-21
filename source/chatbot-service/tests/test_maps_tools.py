import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.maps_tools import (
    search_place,
    search_restaurants_or_cafes,
    get_directions,
    suggest_day_itinerary,
    suggest_dynamic_itinerary,
)


def test_search_place_fallback_curated():
    res = search_place.invoke({"query": "Bà Nà Hills"})
    assert res["success"] is True
    assert res["count"] > 0
    first = res["places"][0]
    assert "Bà Nà" in first["name"]
    assert "image_url" in first
    assert first["rating"] >= 4.0


def test_search_restaurants_or_cafes_seafood():
    res = search_restaurants_or_cafes.invoke({"keyword": "hải sản"})
    assert res["success"] is True
    assert res["count"] > 0
    names = [p["name"] for p in res["places"]]
    assert any("Bé Mặn" in n or "Năm Đảnh" in n for n in names)
    first = res["places"][0]
    assert "distance_km" in first
    assert "image_url" in first


def test_get_directions_to_hoi_an():
    res = get_directions.invoke({"destination": "Phố cổ Hội An", "mode": "driving"})
    assert res["success"] is True
    assert "Hội An" in res["destination_address"]
    assert "km" in res["distance_km"]
    assert "phút" in res["duration_minutes"]
    assert "map_embed_url" in res
    assert "external_maps_url" in res
    assert len(res["steps"]) > 0


def test_get_directions_to_cau_rong():
    res = get_directions.invoke({"destination": "Cầu Rồng"})
    assert res["success"] is True
    assert "km" in res["distance_km"]
    assert "google.com/maps" in res["map_embed_url"]


def test_suggest_day_itinerary_family():
    res = suggest_dynamic_itinerary.invoke({
        "destination": "Đà Nẵng",
        "days": 1,
        "preferences": "khám phá văn hóa di sản",
        "target_audience": "gia đình",
    })
    assert res["success"] is True
    assert "title" in res
    assert res["destination"] == "Đà Nẵng"
    assert len(res["schedule"]) >= 3
    assert len(res["travel_tips"]) > 0
    # Check periods
    periods = [item["period"] for item in res["schedule"]]
    assert any("Sáng" in p or "sáng" in p for p in periods)
    assert any("tối" in p or "Tối" in p or "chiều" in p or "Chiều" in p for p in periods)


def test_suggest_dynamic_itinerary_quang_binh():
    """Kiểm tra lên lịch trình động 2 ngày đi Quảng Bình trả về đúng địa danh Quảng Bình."""
    res = suggest_dynamic_itinerary.invoke({
        "destination": "Quảng Bình",
        "days": 2,
    })
    assert res["success"] is True
    assert "Quảng Bình" in res["title"]
    assert res["destination"] == "Quảng Bình"
    assert res["days"] == 2
    assert len(res["schedule"]) >= 4
    places_text = " ".join([item["place"] + " " + item["title"] for item in res["schedule"]]).lower()
    assert "phong nha" in places_text or "thiên đường" in places_text or "quảng bình" in places_text
    # Không được chứa Bà Nà hay Cầu Rồng của Đà Nẵng
    assert "bà nà" not in places_text
    assert "cầu rồng" not in places_text


def test_search_restaurants_or_cafes_limit_and_exclusion():
    # Lần 1: Lấy 5 quán đầu tiên
    res1 = search_restaurants_or_cafes.invoke({
        "keyword": "hải sản",
        "limit": 5,
    })
    assert res1["success"] is True
    assert res1["count"] == 5
    names1 = set(res1["returned_names"])
    assert len(names1) == 5

    # Lần 2: Yêu cầu "còn quán nào khác không", loại trừ 5 quán lần 1
    res2 = search_restaurants_or_cafes.invoke({
        "keyword": "hải sản",
        "limit": 5,
        "exclude_ids": list(names1),
    })
    assert res2["success"] is True
    assert res2["count"] == 5
    names2 = set(res2["returned_names"])

    # Đảm bảo 2 danh sách hoàn toàn không trùng lặp!
    overlap = names1.intersection(names2)
    assert len(overlap) == 0, f"Trùng lặp quán ăn giữa 2 lần gợi ý: {overlap}"


def test_orchestrator_extract_previous_places():
    from app.agent.orchestrator import AgentOrchestrator
    history = [
        {"role": "user", "content": "Gợi ý quán hải sản gần khách sạn"},
        {"role": "assistant", "content": "Grand Luxury xin gợi ý các quán: Hải sản Bé Mặn, Hải sản Năm Đảnh, Hải sản Bà Rô"},
    ]
    seen = AgentOrchestrator._extract_previous_places(history)
    assert "Hải sản Bé Mặn" in seen
    assert "Hải sản Năm Đảnh" in seen
    assert "Hải sản Bà Rô" in seen


def test_search_bbq_places():
    """Kiểm tra tìm quán nướng trả về các quán nướng/BBQ, không lẫn lộn với hải sản/lẩu."""
    res = search_restaurants_or_cafes.invoke({"keyword": "quán nướng", "limit": 20})
    assert res["success"] is True
    places = res["places"]
    assert len(places) >= 3
    names = [p["name"] for p in places]
    # Phải có quán nướng
    assert any("nhóp nhép" in n.lower() or "nướng" in n.lower() or "bbq" in n.lower() or "gogi" in n.lower() for n in names)
    # Không được có quán hải sản thuần
    assert not any("bé mặn" in n.lower() or "năm đảnh" in n.lower() for n in names)


def test_search_chicken_hotpot_places():
    """Kiểm tra tìm lẩu gà trả về các quán lẩu gà, không bị lẫn với hải sản."""
    res = search_restaurants_or_cafes.invoke({"keyword": "lẩu gà", "limit": 20})
    assert res["success"] is True
    places = res["places"]
    assert len(places) >= 2
    names = [p["name"] for p in places]
    assert any("tao ngộ" in n.lower() or "gà" in n.lower() for n in names)
    assert not any("bé mặn" in n.lower() or "năm đảnh" in n.lower() for n in names)


def test_keyword_extraction_helper():
    from app.agent.orchestrator import AgentOrchestrator
    assert AgentOrchestrator._extract_food_keyword("Gợi ý cho tôi quán nướng ngon gần đây") == "quán nướng"
    assert AgentOrchestrator._extract_food_keyword("Còn quán lẩu gà nào không?") == "lẩu gà"
    assert AgentOrchestrator._extract_food_keyword("Tìm quán hải sản gần khách sạn với") == "hải sản"
    assert AgentOrchestrator._extract_food_keyword("Có quán cafe view đẹp không") in ["quán cafe", "quán cà phê"]



