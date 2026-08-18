import os
from pathlib import Path

TEST_DB = Path("/tmp/tradingagents-web-test.db")
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ["APP_SECRET_KEY"] = "test-secret"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"

from fastapi.testclient import TestClient

from backend.app import app


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert "version" in response.json()


def test_login_seeded_admin():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@local", "password": "admin123"},
        )
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert body["user"]["role"] == "admin"


def test_analysis_requires_auth():
    with TestClient(app) as client:
        response = client.post("/api/v1/analysis", json={"symbol": "RELIANCE.NS"})
        assert response.status_code == 401


def test_stock_search():
    with TestClient(app) as client:
        response = client.get("/api/v1/stocks/search", params={"q": "TCS"})
        assert response.status_code == 200
        assert any(item["symbol"] == "TCS.NS" for item in response.json()["results"])


def test_google_model_rejected_on_analysis():
    with TestClient(app) as client:
        token = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@local", "password": "admin123"},
        ).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post(
            "/api/v1/analysis",
            json={"symbol": "RELIANCE.NS", "llm_provider": "google", "model": "gpt-5.5"},
            headers=headers,
        )
        assert response.status_code == 400
        assert "not compatible with Google Gemini" in response.json()["detail"]


def test_llm_catalog_has_gemini():
    with TestClient(app) as client:
        response = client.get("/api/v1/llm/catalog")
        assert response.status_code == 200
        google = next(item for item in response.json()["providers"] if item["id"] == "google")
        assert all(not option["id"].startswith("gpt-") for option in google["deep"] + google["quick"])


def test_universes_include_reliance_name():
    with TestClient(app) as client:
        response = client.get("/api/v1/stocks/universes")
        nifty = next(item for item in response.json()["items"] if item["id"] == "NIFTY50")
        reliance = next(row for row in nifty["stocks"] if row["symbol"] == "RELIANCE.NS")
        assert reliance["name"] == "Reliance Industries"


def test_watchlist_and_settings_roundtrip():
    with TestClient(app) as client:
        token = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@local", "password": "admin123"},
        ).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        added = client.post("/api/v1/watchlist", json={"symbol": "INFY"}, headers=headers)
        assert added.status_code == 200
        listed = client.get("/api/v1/watchlist", headers=headers)
        assert listed.status_code == 200
        assert any(item["symbol"] == "INFY.NS" for item in listed.json()["items"])
        saved = client.put(
            "/api/v1/settings",
            json={"llm_provider": "openai", "research_depth": "shallow", "enable_news": False},
            headers=headers,
        )
        assert saved.status_code == 200
        assert saved.json()["research_depth"] == "shallow"
        assert saved.json()["enable_news"] is False


def test_scorecard_and_analysis_list_shape():
    with TestClient(app) as client:
        token = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@local", "password": "admin123"},
        ).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        listed = client.get("/api/v1/analysis", params={"limit": 10, "offset": 0}, headers=headers)
        assert listed.status_code == 200
        body = listed.json()
        assert "items" in body
        assert "total" in body
        score = client.get("/api/v1/scorecard", headers=headers)
        assert score.status_code == 200
        data = score.json()
        assert "total_analyses" in data
        assert "average_confidence" in data
        assert "buy" in data
