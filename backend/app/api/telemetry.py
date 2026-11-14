from datetime import datetime, timezone

from fastapi import APIRouter, Query

from core import thresholds as T
from schemas.telemetry import CheckinInput, TelemetryInput
from services import state
from services.ingest import ingest
from services.risk_engine import recommendation

router = APIRouter(tags=["Telemetry"])

SYNC_NOTE = "Yer bilan sinxronizatsiya hali ulanmagan (prototip, LOS rejimi simulyatsiyada)."
ACTION_REQUIRED = {
    "CRITICAL": "HARAKAT QILISH SHART",
    "WARNING": "KUZATISH VA TAYYORGARLIK",
    "NORMAL": "BARQAROR",
    "STALE": "MA'LUMOT YO'Q",
}


def iso(ts: float | None) -> str | None:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts is not None else None


def action_center(status: str, rec: dict) -> dict:
    return {
        "level": status,
        "action_required": ACTION_REQUIRED[status],
        "instruction": rec["action"],
        "reason": rec["reason"],
        "rule_id": rec["rule_id"],
        "confidence": rec["confidence"],
    }


@router.post("/push")
async def push_telemetry(data: TelemetryInput):
    """Sensor yoki simulyatordan telemetriya. Takroriy event_id qayta hisoblanmaydi."""
    result = ingest(data.model_dump(exclude_none=True))
    message = (
        "Takroriy ma'lumot, e'tiborsiz qoldirildi." if result["status"] == "duplicate"
        else "Telemetriya qabul qilindi va tahlil qilindi."
    )
    return {"message": message, **result}


@router.get("/status")
async def get_system_status(crew_id: str = Query(T.DEFAULT_CREW_ID)):
    """Ekipaj holati, xavf byudjeti, check-in holati va Action Center."""
    stats = state.get_analyzer(crew_id).get_statistics()
    status = stats["system_status"] if stats else "STALE"
    rec = stats["recommendation"] if stats else recommendation("STALE", [], [])
    last = state.storage.last_checkin(crew_id)
    return {
        "status": "active",
        "crew_id": crew_id,
        "mode": "offline-edge (Loss of Signal Mode)",
        "sync_status": SYNC_NOTE,
        "checkin": {
            "last_checkin_at": iso(last["created_at"]) if last else None,
            "last_status": last["status"] if last else None,
            "timeout_s": T.CHECKIN_TIMEOUT_S,
        },
        "analytics_summary": stats if stats else "Ma'lumotlar to'planmoqda...",
        "action_center": action_center(status, rec),
    }


@router.post("/crew/{crew_id}/checkin")
async def crew_checkin(crew_id: str, body: CheckinInput):
    """Ekipaj xavfsizligini tasdiqlaydi. NEED_HELP yuborilsa darhol ESCALATION yoziladi."""
    ts = state.storage.add_checkin(crew_id, body.status, body.note)
    if body.status == "NEED_HELP":
        state.storage.add_event(crew_id, "ESCALATION", f"Ekipaj yordam so'radi: {body.note}", ts)
    return {"status": "recorded", "crew_id": crew_id, "checkin_at": iso(ts), "checkin_status": body.status}


@router.get("/events")
async def list_events(crew_id: str = Query(T.DEFAULT_CREW_ID), limit: int = Query(50, ge=1, le=500)):
    """LOS, holat o'zgarishi va eskalatsiya hodisalari (eng yangisi birinchi)."""
    events = state.storage.list_events(crew_id, limit)
    return {
        "crew_id": crew_id,
        "events": [{"kind": e["kind"], "detail": e["detail"], "at": iso(e["created_at"])} for e in events],
    }


@router.get("/crews")
async def list_crews():
    return {"crews": state.known_crews()}
