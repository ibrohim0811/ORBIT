from fastapi import APIRouter, HTTPException
from services.simulator import simulator

router = APIRouter(prefix="/simulator", tags=["Simulator"])

@router.post("/mode")
async def change_simulator_mode(mode: str):
    """
    Simulyator rejimini o'zgartirish. 
    Ishlatilishi: /simulator/mode?mode=storm (yoki normal, warning)
    """
    success = simulator.set_mode(mode)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Yaroqsiz rejim. Variantlar: normal, warning, critical"
        )
    return {"status": "success", "current_mode": mode}