import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.hotel_tools import get_room_pricing, search_available_rooms, get_room_details
from app.tools.booking_tools import create_booking_request, confirm_booking_request
from app.tools.checkin_tools import get_checkin_eligibility, prepare_face_checkin
from app.tools.context import current_jwt_token



def test_get_room_pricing():
    # 2 nights: 2026-11-20 to 2026-11-22 at 1,000,000 VND/night
    res = get_room_pricing.invoke({
        "price_per_night": 1000000,
        "check_in": "2026-11-20",
        "check_out": "2026-11-22",
    })
    assert res["success"] is True
    assert res["number_of_nights"] == 2
    assert res["total_amount"] == 2000000

    # Invalid: check_out <= check_in
    res_err = get_room_pricing.invoke({
        "price_per_night": 1000000,
        "check_in": "2026-11-22",
        "check_out": "2026-11-20",
    })
    assert res_err["success"] is False
    assert "error" in res_err


def test_create_booking_request():
    res = create_booking_request.invoke({
        "room_id": "c7a6e1d2-0000-0000-0000-000000000001",
        "room_name": "Phòng 201 - Deluxe Ocean",
        "check_in_date": "2026-12-01",
        "check_out_date": "2026-12-03",
        "number_of_guests": 2,
        "price_per_night": 1200000,
        "note": "Tầng cao view đẹp",
    })
    assert res["success"] is True
    assert res["requires_confirmation"] is True
    preview = res["preview"]
    assert preview["number_of_nights"] == 2
    assert preview["total_amount"] == 2400000
    assert preview["note"] == "Tầng cao view đẹp"


def test_confirm_booking_request_without_token():
    current_jwt_token.set(None)
    res = confirm_booking_request.invoke({
        "room_id": "c7a6e1d2-0000-0000-0000-000000000001",
        "check_in_date": "2026-12-01",
        "check_out_date": "2026-12-03",
        "number_of_guests": 2,
    })
    assert res["success"] is False
    assert res["error_code"] == "AUTH_REQUIRED"


def test_search_available_rooms_mock():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "success": True,
        "data": [
            {
                "id": "room-uuid-1",
                "room_number": "101",
                "floor": 1,
                "room_type_id": "type-uuid-1",
                "room_types": {
                    "name": "Standard City View",
                    "base_price": 800000,
                    "max_guests": 2,
                    "amenities": "Wi-Fi, TV",
                },
            }
        ],
    }

    with patch("httpx.Client.get", return_value=mock_response):
        res = search_available_rooms.invoke({
            "check_in": "2026-11-20",
            "check_out": "2026-11-22",
            "guests": 2,
        })
        assert res["success"] is True
        assert res["total_available"] == 1
        assert res["rooms"][0]["room_number"] == "101"
        assert res["rooms"][0]["price_per_night"] == 800000


def test_search_available_rooms_filtering():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "success": True,
        "data": [
            {
                "id": "room-uuid-1",
                "room_number": "101",
                "floor": 1,
                "description": "Phòng tiêu chuẩn",
                "room_type_id": "type-uuid-1",
                "room_types": {
                    "name": "Standard City View",
                    "base_price": 800000,
                    "max_guests": 2,
                },
            },
            {
                "id": "room-uuid-2",
                "room_number": "704",
                "floor": 7,
                "description": "Phòng hạng sang nhìn ra biển",
                "room_type_id": "type-uuid-2",
                "room_types": {
                    "name": "Deluxe Ocean View",
                    "base_price": 1600000,
                    "max_guests": 2,
                },
            },
        ],
    }

    with patch("httpx.Client.get", return_value=mock_response):
        # 1. Search for Deluxe
        res = search_available_rooms.invoke({
            "check_in": "2026-11-20",
            "check_out": "2026-11-22",
            "guests": 2,
            "room_type_name": "Deluxe",
        })
        assert res["success"] is True
        assert res["total_available"] == 1
        assert res["rooms"][0]["room_number"] == "704"
        assert res["rooms"][0]["room_type_name"] == "Deluxe Ocean View"

        # 2. Search for Standard
        res_std = search_available_rooms.invoke({
            "check_in": "2026-11-20",
            "check_out": "2026-11-22",
            "guests": 2,
            "room_type_name": "Standard",
        })
        assert res_std["success"] is True
        assert res_std["total_available"] == 1
        assert res_std["rooms"][0]["room_number"] == "101"

        # 3. Test exact filter for "Phòng Suite thương gia"
        mock_suite_response = MagicMock()
        mock_suite_response.status_code = 200
        mock_suite_response.json.return_value = {
            "success": True,
            "data": [
                {
                    "id": "room-suite-small",
                    "room_number": "501",
                    "room_types": {"name": "Phòng Suite nhỏ", "base_price": 1500000},
                },
                {
                    "id": "room-suite-exec",
                    "room_number": "603",
                    "room_types": {"name": "Phòng Suite thương gia", "base_price": 4500000},
                },
                {
                    "id": "room-standard",
                    "room_number": "101",
                    "room_types": {"name": "Phòng tiêu chuẩn", "base_price": 800000},
                },
            ],
        }

    with patch("httpx.Client.get", return_value=mock_suite_response):
        res_suite = search_available_rooms.invoke({
            "check_in": "2026-11-14",
            "check_out": "2026-11-16",
            "guests": 2,
            "room_type_name": "Phòng Suite thương gia",
        })
        assert res_suite["success"] is True
        assert res_suite["total_available"] == 1
        assert res_suite["rooms"][0]["room_number"] == "603"
        assert res_suite["rooms"][0]["room_type_name"] == "Phòng Suite thương gia"


def test_confirm_booking_request_with_room_number_resolution_and_payment():
    from app.tools.booking_tools import resolve_room_id
    current_jwt_token.set("mock-jwt-token")

    mock_search_resp = MagicMock()
    mock_search_resp.status_code = 200
    mock_search_resp.json.return_value = {
        "success": True,
        "data": [{"id": "c7a6e1d2-0000-0000-0000-000000000704", "room_number": "704"}],
    }

    mock_booking_resp = MagicMock()
    mock_booking_resp.status_code = 201
    mock_booking_resp.json.return_value = {
        "success": True,
        "data": {
            "id": "booking-uuid-704",
            "booking_code": "BK-261120-704",
            "status": "pending_payment",
            "check_in_date": "2026-11-20",
            "check_out_date": "2026-11-22",
            "number_of_guests": 2,
        },
    }

    mock_payment_resp = MagicMock()
    mock_payment_resp.status_code = 200
    mock_payment_resp.json.return_value = {
        "success": True,
        "data": {
            "gateway": "paypal",
            "payUrl": "https://www.sandbox.paypal.com/checkoutnow?token=mock704",
            "orderId": "PAYPAL_BK704",
        },
    }

    def mock_get(url, *args, **kwargs):
        return mock_search_resp

    def mock_post(url, *args, **kwargs):
        if "/api/bookings" in url:
            return mock_booking_resp
        elif "/api/payments" in url:
            return mock_payment_resp
        return MagicMock(status_code=404)

    with patch("httpx.Client.get", side_effect=mock_get), patch("httpx.Client.post", side_effect=mock_post):
        # Pass room_number "704" instead of UUID
        res = confirm_booking_request.invoke({
            "room_id": "704",
            "check_in_date": "2026-11-20",
            "check_out_date": "2026-11-22",
            "number_of_guests": 2,
        })

        assert res["success"] is True
        assert res["booking"]["booking_code"] == "BK-261120-704"
        assert res["payment_url"] == "https://www.sandbox.paypal.com/checkoutnow?token=mock704"
        assert res["payment"]["gateway"] == "paypal"


def test_prepare_face_checkin():
    res = prepare_face_checkin.invoke({
        "booking_id": "c7a6e1d2-0000-0000-0000-000000000001",
        "booking_code": "BK20261114001",
    })
    assert res["success"] is True
    assert res["booking_id"] == "c7a6e1d2-0000-0000-0000-000000000001"
    assert res["booking_code"] == "BK20261114001"


def test_get_checkin_eligibility_without_token():
    current_jwt_token.set(None)
    res = get_checkin_eligibility.invoke({})
    assert res["success"] is False
    assert res["can_checkin"] is False
    assert res["error"] == "AUTH_REQUIRED"


def test_get_checkin_eligibility_with_confirmed_booking_and_face():
    current_jwt_token.set("mock-token-customer")

    mock_face_resp = MagicMock()
    mock_face_resp.status_code = 200
    mock_face_resp.json.return_value = {
        "success": True,
        "data": {"id": "face-id-1", "is_active": True},
    }

    mock_bookings_resp = MagicMock()
    mock_bookings_resp.status_code = 200
    mock_bookings_resp.json.return_value = {
        "success": True,
        "data": [
            {
                "id": "b-confirmed-1",
                "booking_code": "BK20261114001",
                "status": "confirmed",
                "rooms": {"room_number": "502", "room_types": {"name": "Deluxe Ocean"}},
            }
        ],
    }

    def mock_get(url, *args, **kwargs):
        if "/api/faces/me" in url:
            return mock_face_resp
        elif "/api/bookings" in url:
            return mock_bookings_resp
        return MagicMock(status_code=404)

    with patch("httpx.Client.get", side_effect=mock_get):
        res = get_checkin_eligibility.invoke({})
        assert res["success"] is True
        assert res["can_checkin"] is True
        assert res["has_face_profile"] is True
        assert res["booking_code"] == "BK20261114001"
        assert res["room_number"] == "502"

