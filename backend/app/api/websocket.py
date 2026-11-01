from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from api.telemetry import analyzer  # Telemetry roturidagi umumiy analyzer obyektini olamiz

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """
    Frontend uchun jonli WebSocket ulanishi.
    Har 1 sekundda analyzer statistikasi va xavf byudjetini yuborib turadi.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Analyzer'dan joriy statistikani olamiz
            stats = analyzer.get_statistics()
            
            payload = {
                "status": "connected",
                "mode": "offline-edge (Loss of Signal)",
                "analytics": stats if stats else {"message": "Ma'lumotlar kutilmoqda..."}
            }
            
            # Ulangan klienta ma'lumotni yuboramiz
            await websocket.send_json(payload)
            
            # 1 sekund kutish (real-time oqim chastotasi)
            await asyncio.sleep(1.0)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)