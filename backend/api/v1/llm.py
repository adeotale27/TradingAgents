from fastapi import APIRouter

from backend.integrations.llm_catalog import catalog

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/catalog")
def llm_catalog():
    return catalog()
