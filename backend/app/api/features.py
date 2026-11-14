"""Frontend paneli uchun API'lar: Dashboard, Search, Notes/Logs, Data Sync, Crew Communication (AI)."""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from core import thresholds as T
from services import ai, state

router = APIRouter(tags=["Panel"])


def iso(ts: float | None) -> str | None:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts is not None else None


def _status_or_none(crew_id: str) -> dict | None:
    stats = state.get_analyzer(crew_id).get_statistics()
    return stats or None


# ---------- Dashboard (Layers ikonkasi) ----------
@router.get("/dashboard")
async def dashboard(crew_id: str = Query(T.DEFAULT_CREW_ID)):
    """Bitta so'rovda ekipaj paneli uchun to'liq ko'rinish."""
    stats = _status_or_none(crew_id)
    last_sample = state.storage.latest_sample(crew_id)
    last_checkin = state.storage.last_checkin(crew_id)
    events = state.storage.list_events(crew_id, 5)
    return {
        "crew_id": crew_id,
        "system_status": stats["system_status"] if stats else "STALE",
        "latest_vitals": {
            "heart_rate": last_sample["heart_rate"] if last_sample else None,
            "blood_pressure_sys": last_sample["blood_pressure_sys"] if last_sample else None,
            "radiation_level": last_sample["radiation_level"] if last_sample else None,
            "co2_level": last_sample["co2_level"] if last_sample else None,
            "sleep_debt": last_sample["sleep_debt"] if last_sample else None,
            "received_at": iso(last_sample["received_at"]) if last_sample else None,
        },
        "risk_budget": stats["risk_budget"] if stats else None,
        "recommendation": stats["recommendation"] if stats else None,
        "last_checkin": {"status": last_checkin["status"], "at": iso(last_checkin["created_at"])} if last_checkin else None,
        "recent_events": [{"kind": e["kind"], "detail": e["detail"], "at": iso(e["created_at"])} for e in events],
        "notes_count": len(state.storage.list_notes(crew_id, 500)),
        "pending_sync_samples": state.storage.pending_samples(crew_id),
    }


# ---------- Search Telemetry (Search ikonkasi) ----------
@router.get("/search")
async def search(crew_id: str = Query(T.DEFAULT_CREW_ID), q: str = Query(..., min_length=1, max_length=100),
                 limit: int = Query(50, ge=1, le=500)):
    """Hodisa, eslatma va check-in izohlari bo'yicha qidiruv."""
    rows = state.storage.search(crew_id, q, limit)
    return {"crew_id": crew_id, "query": q, "count": len(rows),
            "results": [{"type": r["type"], "title": r["title"], "text": r["text"], "at": iso(r["created_at"])} for r in rows]}


@router.get("/telemetry/history")
async def telemetry_history(
    crew_id: str = Query(T.DEFAULT_CREW_ID),
    since_seconds_ago: float | None = Query(None, ge=0, description="Shu vaqtdan beri (soniya)"),
    hr_min: float | None = Query(None), hr_max: float | None = Query(None),
    rad_min: float | None = Query(None, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """Telemetriya tarixi, filtrlar bilan (masalan, yurak urishi 120 dan yuqori)."""
    import time
    since = time.time() - since_seconds_ago if since_seconds_ago is not None else None
    rows = state.storage.history(crew_id, since, limit, hr_min, hr_max, rad_min)
    return {"crew_id": crew_id, "count": len(rows),
            "samples": [{"event_id": r["event_id"], "at": iso(r["received_at"]), "heart_rate": r["heart_rate"],
                         "blood_pressure_sys": r["blood_pressure_sys"], "radiation_level": r["radiation_level"],
                         "co2_level": r["co2_level"], "sleep_debt": r["sleep_debt"]} for r in rows]}


# ---------- Notes / Logs (Notes ikonkasi) ----------
class NoteInput(BaseModel):
    author: str = Field(..., min_length=1, max_length=64)
    text: str = Field(..., min_length=1, max_length=2000)


@router.get("/notes")
async def list_notes(crew_id: str = Query(T.DEFAULT_CREW_ID), limit: int = Query(50, ge=1, le=500)):
    notes = state.storage.list_notes(crew_id, limit)
    return {"crew_id": crew_id, "notes": [{**n, "at": iso(n["created_at"])} for n in notes]}


@router.post("/notes")
async def add_note(body: NoteInput, crew_id: str = Query(T.DEFAULT_CREW_ID)):
    note = state.storage.add_note(crew_id, body.author, body.text)
    return {"status": "saved", "note": {**note, "at": iso(note["created_at"])}}


# ---------- Data Sync (RefreshCw ikonkasi) ----------
@router.post("/sync")
async def sync_now(crew_id: str = Query(T.DEFAULT_CREW_ID)):
    """Yer stansiyasiga sinxronizatsiya. Aloqa (LOS) bo'lmasa, ma'lumot navbatda qoladi."""
    pending = state.storage.pending_samples(crew_id)
    if state.get_analyzer(crew_id).is_stale():
        return {"status": "deferred", "crew_id": crew_id, "pending_samples": pending,
                "reason": "LOS: aloqa yo'q, ma'lumot navbatda saqlanadi va aloqa tiklanganda yuboriladi."}
    at = state.storage.mark_synced(crew_id, pending)
    return {"status": "synced", "crew_id": crew_id, "synced_samples": pending, "synced_at": iso(at)}


@router.get("/sync/status")
async def sync_status(crew_id: str = Query(T.DEFAULT_CREW_ID)):
    last = state.storage.last_sync(crew_id)
    return {"crew_id": crew_id,
            "link": "LOS" if state.get_analyzer(crew_id).is_stale() else "OK",
            "pending_samples": state.storage.pending_samples(crew_id),
            "last_sync_at": iso(last["last_sync_at"]) if last else None,
            "last_synced_count": last["last_synced_count"] if last else 0}


# ---------- Crew Communication (MessageSquare ikonkasi, Ollama) ----------
class ChatInput(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


@router.get("/ai/status")
async def ai_status():
    """Sarlavhadagi 'AI Engine' holati."""
    return ai.ollama_status()


@router.post("/chat")
async def chat(body: ChatInput, crew_id: str = Query(T.DEFAULT_CREW_ID)):
    """Ekipaj savoli. Javobni Ollama beradi; u o'chiq bo'lsa qoida asosidagi zaxira javob qaytadi."""
    import asyncio

    stats = _status_or_none(crew_id)
    events = state.storage.list_events(crew_id, 5)
    prompt = ai.build_prompt(body.message, stats, events)
    answer = await asyncio.to_thread(ai.ask_ollama, prompt)
    if answer is None:
        return {"crew_id": crew_id, "source": "rule_fallback", "engine": ai.ollama_status(),
                "answer": ai.fallback_answer(stats)}
    return {"crew_id": crew_id, "source": "ollama", "engine": ai.ollama_status(), "answer": answer}
