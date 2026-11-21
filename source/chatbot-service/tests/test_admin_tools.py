import os
import sys
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.admin_tools import get_admin_dashboard_stats, get_admin_ai_comparison_stats
from app.tools.context import current_jwt_token, current_user_role


def test_get_admin_dashboard_stats_success():
    current_jwt_token.set("mock-admin-token")
    current_user_role.set("admin")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "success": True,
        "data": {
            "rooms": {"total": 50, "occupied": 35, "available": 10, "reserved": 5},
            "bookings_today": 12,
            "revenue_today": 25000000,
            "revenue_this_month": 450000000,
            "occupancy_rate": 70.0,
            "new_customers_this_month": 28,
        },
    }

    with patch("httpx.Client.get", return_value=mock_resp):
        res = get_admin_dashboard_stats.invoke({})
        assert res["success"] is True
        assert res["bookings_today"] == 12
        assert res["revenue_today"] == 25000000
        assert res["occupancy_rate"] == 70.0
        assert res["rooms"]["total"] == 50


def test_get_admin_ai_comparison_stats_success():
    current_jwt_token.set("mock-admin-token")
    current_user_role.set("admin")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "success": True,
        "data": {
            "overview": {
                "totalRuns": 100,
                "agreementCount": 98,
                "discrepancyCount": 2,
            },
            "facenet": {
                "accuracy": 0.982,
                "eer": 0.018,
                "avgInferenceTimeMs": 42.5,
            },
            "insightface": {
                "accuracy": 0.996,
                "eer": 0.0045,
                "avgInferenceTimeMs": 65.2,
            },
        },
    }

    with patch("httpx.Client.get", return_value=mock_resp):
        res = get_admin_ai_comparison_stats.invoke({})
        assert res["success"] is True
        assert res["overview"]["totalRuns"] == 100
        assert res["agreement_rate"] == 98.0
        assert res["facenet"]["accuracy"] == 0.982
        assert res["insightface"]["accuracy"] == 0.996
