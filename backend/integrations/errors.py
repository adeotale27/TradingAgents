"""Map engine/provider errors to operator-facing categories. Never remaps providers."""

from __future__ import annotations

CATEGORIES = {
    "authentication": "Authentication failed. Check the provider API key in Setup.",
    "invalid_model": "The selected model is not valid for this provider.",
    "provider_unavailable": "The model provider is currently unavailable.",
    "rate_limit": "The model provider rate-limited this request. Wait and retry.",
    "quota_exceeded": "API quota was exceeded.",
    "market_data": "Market data was unavailable for this symbol.",
    "internal": "Analysis could not be completed due to an engine or provider error.",
}


def classify_error(message: str | None) -> tuple[str, str]:
    raw = (message or "").strip()
    lower = raw.lower()
    if not raw:
        return "internal", CATEGORIES["internal"]
    if "not compatible" in lower or "invalid model" in lower or "unknown model" in lower:
        return "invalid_model", CATEGORIES["invalid_model"]
    if any(token in lower for token in ("unauthenticated", "invalid_api_key", "api key", "401", "permission_denied", "403")):
        return "authentication", CATEGORIES["authentication"]
    if "quota" in lower or "resource_exhausted" in lower:
        provider = "Gemini " if "gemini" in lower or "google" in lower else ""
        return "quota_exceeded", f"{provider}API quota was exceeded."
    if "429" in lower or "rate limit" in lower or "too many requests" in lower:
        return "rate_limit", CATEGORIES["rate_limit"]
    if any(token in lower for token in ("503", "unavailable", "overloaded", "service unavailable")):
        return "provider_unavailable", CATEGORIES["provider_unavailable"]
    if any(token in lower for token in ("market data", "yahoo", "no data", "quote", "delisted")):
        return "market_data", CATEGORIES["market_data"]
    return "internal", CATEGORIES["internal"]
