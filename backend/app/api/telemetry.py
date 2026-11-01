from fastapi import APIRouter
from utils.analytics import TelemetryAnalyzer
from schemas.telemetry import TelemetryInput


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



@router.post("/push")
async def push_telemetry(data: TelemetryInput):
    """Kema sensorlaridan yoki simulyatordan kelgan ma'lumotni buferga qo'shadi"""
    analyzer.add_data_point(data.dict())
    return {"status": "success", "message": "Telemetriya ma'lumoti qabul qilindi va tahlil qilindi."}

@router.get("/status")
async def get_system_status():
    """Tizimning hozirgi holati, Risk Budget va Action Center tavsiyalarini qaytaradi"""
    stats = analyzer.get_statistics()
    
    if not stats:
        return {
            "status": "active",
            "mode": "offline-edge",
            "analytics_summary": "Ma'lumotlar to'planmoqda...",
            "action_guidance": None
        }

    # Action Center: Holatga qarab aniq tavsiya berish (Actionable Guidance)
    system_status = stats.get("system_status")
    guidance = {}

    if system_status == "CRITICAL":
        guidance = {
            "level": "CRITICAL",
            "action_required": "HARAKAT QILISH SHART",
            "instruction": "Darhol Modul-B himoyalangan yotoqxonasiga o'ting! Radiatsiya qalqoni faollashtirildi.",
            "confidence": stats.get("confidence_score"),
            "estimated_dose_saved": "74% doza tejaldi"
        }
    elif system_status == "WARNING":
        guidance = {
            "level": "WARNING",
            "action_required": "KUZATISH VA TAYYORGARLIK",
            "instruction": "Aerobik yuklamani kamaytiring va dam oling. Kosmik ob-havo monitoringi davom etmoqda.",
            "confidence": stats.get("confidence_score")
        }
    else:
        guidance = {
            "level": "NORMAL",
            "action_required": "BARQAROR",
            "instruction": "Barcha parametrlar me'yorda. Ekipaj o'z rejimini davom ettirishi mumkin.",
            "confidence": stats.get("confidence_score")
        }

    return {
        "status": "active",
        "mode": "offline-edge (Loss of Signal Mode)",
        "sync_status": "Yer bilan aloqa yo'q. Keyingi sinxronizatsiya: 18 daqiqadan so'ng.",
        "analytics_summary": stats,
        "action_center": guidance
    }