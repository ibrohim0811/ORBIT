import asyncio

from fastapi import APIRouter, WebSocket

from core import thresholds as T
from services import state

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """Har 1 sekundda tanlangan ekipaj holatini yuboradi (?crew_id=CREW-1)."""
    crew_id = websocket.query_params.get("crew_id", T.DEFAULT_CREW_ID)
    await websocket.accept()
    try:
        while True:
            stats = state.get_analyzer(crew_id).get_statistics()
            await websocket.send_json({
                "status": "connected",
                "crew_id": crew_id,
                "mode": "offline-edge (Loss of Signal)",
                "analytics": stats if stats else {"message": "Ma'lumotlar kutilmoqda..."},
            })
            await asyncio.sleep(1.0)
    except Exception:
        pass  # klient uzildi: ulanish yopiladi, server to'xtamaydi
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
