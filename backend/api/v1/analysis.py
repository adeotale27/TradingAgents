from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from backend.core.db import get_db
from backend.core.deps import get_current_user
from backend.integrations.india import universe_rows
from backend.models import Analysis, User
from backend.schemas import AnalysisCreate, AnalysisQueued
from backend.services.analysis import ActiveRunError, cancel_analysis, create_analysis
from backend.services.events import event_bus, sse_pack
from backend.services.serialize import serialize_analysis

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("", response_model=AnalysisQueued)
def start_analysis(
    body: AnalysisCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        analysis = create_analysis(db, user, body)
    except ActiveRunError as exc:
        raise HTTPException(
            status_code=409,
            detail={
                "message": str(exc),
                "analysis_id": exc.analysis.id,
                "status": exc.analysis.status,
                "symbol": exc.analysis.symbol,
            },
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AnalysisQueued(analysis_id=analysis.id, status=analysis.status)


@router.get("")
def list_analysis(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    symbol: str | None = None,
    decision: str | None = None,
    status: str | None = None,
    q: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = db.query(Analysis).filter(Analysis.user_id == user.id)
    if symbol:
        query = query.filter(Analysis.symbol == symbol.upper())
    if status:
        wanted = []
        for part in status.split(","):
            key = part.strip().lower()
            if key == "running":
                wanted.extend(["queued", "running"])
            elif key:
                wanted.append(key)
        if wanted:
            query = query.filter(Analysis.status.in_(sorted(set(wanted))))
    if q:
        needle = q.strip().upper()
        names = [ticker for ticker, name, _ in universe_rows("ALL") if needle in ticker.upper() or needle in name.upper()]
        query = query.filter(or_(Analysis.symbol.contains(needle), Analysis.symbol.in_(names or ["__none__"])))
    if decision:
        query = query.filter(Analysis.final_decision == decision.upper())
    total = query.count()
    page_ids = [row.id for row in query.order_by(Analysis.created_at.desc()).offset(offset).limit(limit).all()]
    if not page_ids:
        return {"items": [], "total": total, "limit": limit, "offset": offset}
    rows = (
        db.query(Analysis)
        .options(joinedload(Analysis.agents), joinedload(Analysis.decision))
        .filter(Analysis.id.in_(page_ids))
        .all()
    )
    by_id = {row.id: row for row in rows}
    ordered = [by_id[item_id] for item_id in page_ids if item_id in by_id]
    return {
        "items": [serialize_analysis(row, include_payload=False) for row in ordered],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    analysis = db.get(Analysis, analysis_id)
    if not analysis or (analysis.user_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=404, detail="Analysis not found")
    return serialize_analysis(analysis)


@router.post("/{analysis_id}/cancel")
def cancel(
    analysis_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    analysis = db.get(Analysis, analysis_id)
    if not analysis or analysis.user_id != user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return serialize_analysis(cancel_analysis(db, analysis), include_payload=False)


@router.get("/{analysis_id}/events")
async def analysis_events(analysis_id: str):
    async def gen():
        async for event in event_bus.subscribe(analysis_id):
            yield sse_pack(event)
            if event.get("type") in {"analysis_completed", "analysis_failed"}:
                break

    return StreamingResponse(gen(), media_type="text/event-stream")
