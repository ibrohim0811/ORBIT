import asyncio
import time

from fastapi import APIRouter, WebSocket

from core import thresholds as T
from services import state

router = APIRouter(tags=["WebSocket"])


class WebSocketManager:
    """Barcha WebSocket mijozlari uchun statistikalarni keshlash va ortiqcha hisob-kitoblarni oldini olish."""

    def __init__(self):
        self._stats_cache: dict[str, tuple[float, dict]] = {}

    def get_payload(self, crew_id: str) -> dict:
        now = time.time()
        cached = self._stats_cache.get(crew_id)
        # 0.8 soniya ichida qayta hisoblamaslik (barcha bir xil ekipajdagi mijozlar umumiy keshdan foydalanadi)
        if cached and (now - cached[0] < 0.8):
            return cached[1]

        stats = state.get_analyzer(crew_id).get_statistics()
        payload = {
            "status": "connected",
            "crew_id": crew_id,
            "mode": "offline-edge (Loss of Signal)",
            "analytics": stats if stats else {"message": "Ma'lumotlar kutilmoqda..."},
        }
        self._stats_cache[crew_id] = (now, payload)
        return payload


manager = WebSocketManager()


@router.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """Har 1 sekundda tanlangan ekipaj holatini yuboradi (?crew_id=CREW-1)."""
    crew_id = websocket.query_params.get("crew_id", T.DEFAULT_CREW_ID)
    await websocket.accept()
    try:
        while True:
            payload = manager.get_payload(crew_id)
            await websocket.send_json(payload)
            await asyncio.sleep(1.0)
    except Exception:
        pass  # klient uzildi: ulanish yopiladi, server to'xtamaydi
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
