from fastapi import APIRouter
from utils.analytics import TelemetryAnalyzer

router = APIRouter()
analyzer = TelemetryAnalyzer()

@router.get("/status")
async def get_system_status():
    """Tizimning hozirgi holati va NumPy/Pandas tahlil natijalarini qaytaradi"""
    stats = analyzer.get_statistics()
    return {
        "status": "active",
        "mode": "offline-edge",
        "analytics_summary": stats if stats else "Ma'lumotlar to'planmoqda..."
    }