from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.db import get_db
from backend.core.deps import get_current_user
from backend.models import Analysis, User

router = APIRouter(prefix="/scorecard", tags=["scorecard"])


@router.get("")
def scorecard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Analysis).filter(Analysis.user_id == user.id).all()
    total = len(rows)
    by_status = {key: 0 for key in ("queued", "running", "completed", "failed", "cancelled")}
    by_decision = {"BUY": 0, "HOLD": 0, "SELL": 0}
    confidences: list[float] = []
    durations: list[float] = []
    for row in rows:
        by_status[row.status] = by_status.get(row.status, 0) + 1
        action = (row.final_decision or "").upper()
        if action in by_decision:
            by_decision[action] += 1
        if row.confidence is not None:
            confidences.append(row.confidence)
        start = row.started_at or row.created_at
        end = row.completed_at
        if start and end:
            durations.append(max(0.0, (end - start).total_seconds()))
    return {
        "total_analyses": total,
        "buy": by_decision["BUY"],
        "hold": by_decision["HOLD"],
        "sell": by_decision["SELL"],
        "completed": by_status["completed"],
        "failed": by_status["failed"],
        "cancelled": by_status["cancelled"],
        "queued": by_status["queued"],
        "running": by_status["running"],
        "average_confidence": round(sum(confidences) / len(confidences), 2) if confidences else None,
        "average_duration_seconds": round(sum(durations) / len(durations), 1) if durations else None,
    }
