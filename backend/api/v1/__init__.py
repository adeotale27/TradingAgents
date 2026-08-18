from fastapi import APIRouter

from backend.api.v1 import admin, analysis, auth, backtests, llm, market, scorecard, settings, stocks, watchlist
from backend.core.version import APP_VERSION, ENGINE_VERSION

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(stocks.router)
api_router.include_router(analysis.router)
api_router.include_router(watchlist.router)
api_router.include_router(settings.router)
api_router.include_router(backtests.router)
api_router.include_router(admin.router)
api_router.include_router(llm.router)
api_router.include_router(market.router)
api_router.include_router(scorecard.router)


@api_router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "tradingagents-terminal",
        "version": APP_VERSION,
        "engine_version": ENGINE_VERSION,
    }
