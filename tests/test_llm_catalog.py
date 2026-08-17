from backend.integrations.llm_catalog import compatible, default_models, require_compatible


def test_google_rejects_openai_model():
    assert compatible("google", "gpt-5.5") is False
    try:
        require_compatible("google", "gpt-5.5")
        raise AssertionError("expected error")
    except ValueError as exc:
        assert "gpt-5.5 is not compatible with Google Gemini" in str(exc)


def test_google_accepts_gemini():
    deep, quick = default_models("google")
    assert deep.startswith("gemini")
    assert quick.startswith("gemini")
    require_compatible("google", deep)
    require_compatible("google", quick)


def test_openai_rejects_gemini():
    assert compatible("openai", "gemini-3.1-pro-preview") is False
