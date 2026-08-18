"""Provider error classification for the web layer."""

from backend.integrations.errors import classify_error


def test_quota_exceeded():
    category, friendly = classify_error("429 RESOURCE_EXHAUSTED quota exceeded Gemini")
    assert category == "quota_exceeded"
    assert "quota" in friendly.lower()


def test_google_model_mismatch():
    category, friendly = classify_error("Model gpt-5.5 is not compatible with Google Gemini.")
    assert category == "invalid_model"


def test_empty_is_internal():
    category, _ = classify_error(None)
    assert category == "internal"
