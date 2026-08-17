"""Provider-aware LLM catalog and validation for the web layer.

Uses the existing TradingAgents MODEL_OPTIONS. Never remaps OpenAI IDs to Gemini.
"""

from __future__ import annotations

from tradingagents.llm_clients.model_catalog import MODEL_OPTIONS
from tradingagents.llm_clients.validators import VALID_MODELS, _ANY_MODEL_PROVIDERS

WEB_PROVIDERS = (
    "openai",
    "google",
    "anthropic",
    "xai",
    "deepseek",
    "ollama",
    "openrouter",
    "groq",
)

PROVIDER_LABELS = {
    "openai": "OpenAI",
    "google": "Google Gemini",
    "anthropic": "Anthropic",
    "xai": "xAI",
    "deepseek": "DeepSeek",
    "ollama": "Ollama",
    "openrouter": "OpenRouter",
    "groq": "Groq",
}

THINKING_MODES = {
    "google": [
        {"id": "high", "label": "Enable Thinking (recommended)"},
        {"id": "minimal", "label": "Minimal / Disable Thinking"},
    ],
    "openai": [
        {"id": "medium", "label": "Medium (default)"},
        {"id": "high", "label": "High (more thorough)"},
        {"id": "low", "label": "Low (faster)"},
    ],
    "anthropic": [
        {"id": "high", "label": "High (recommended)"},
        {"id": "medium", "label": "Medium (balanced)"},
        {"id": "low", "label": "Low (faster, cheaper)"},
    ],
}


def catalog() -> dict:
    providers = []
    for key in WEB_PROVIDERS:
        modes = MODEL_OPTIONS.get(key)
        if not modes:
            continue
        providers.append(
            {
                "id": key,
                "label": PROVIDER_LABELS[key],
                "quick": [{"label": label, "id": value} for label, value in modes.get("quick", []) if value != "custom"],
                "deep": [{"label": label, "id": value} for label, value in modes.get("deep", []) if value != "custom"],
                "allows_custom": any(value == "custom" for options in modes.values() for _, value in options),
                "thinking_modes": THINKING_MODES.get(key, []),
            }
        )
    return {"providers": providers}


def default_models(provider: str) -> tuple[str, str]:
    key = (provider or "openai").lower()
    modes = MODEL_OPTIONS.get(key) or MODEL_OPTIONS["openai"]
    deep = next(value for _, value in modes["deep"] if value != "custom")
    quick = next(value for _, value in modes["quick"] if value != "custom")
    return deep, quick


def compatible(provider: str, model: str | None) -> bool:
    if not model:
        return False
    provider_l = provider.lower()
    model_l = model.strip()
    if provider_l == "google" and model_l.lower().startswith("gpt-"):
        return False
    if provider_l == "openai" and model_l.lower().startswith("gemini"):
        return False
    if provider_l in _ANY_MODEL_PROVIDERS:
        return True
    known = VALID_MODELS.get(provider_l)
    if not known:
        return True
    return model_l in known


def require_compatible(provider: str, model: str | None, role: str = "Model") -> str:
    provider_l = (provider or "").lower()
    if not provider_l:
        raise ValueError("LLM provider is required.")
    if not model:
        raise ValueError(f"{role} is required for {PROVIDER_LABELS.get(provider_l, provider_l)}.")
    if not compatible(provider_l, model):
        label = PROVIDER_LABELS.get(provider_l, provider_l)
        raise ValueError(f"{role} {model} is not compatible with {label}.")
    return model
