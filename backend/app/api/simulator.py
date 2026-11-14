from fastapi import APIRouter, HTTPException, Query

from services.simulator import ACCEPTED_INPUT, simulator

router = APIRouter(prefix="/simulator", tags=["Simulator"])


@router.get("/mode")
async def get_simulator_mode():
    return {"current_mode": simulator.mode, "available_modes": list(ACCEPTED_INPUT)}


@router.post("/mode")
async def change_simulator_mode(mode: str = Query(..., description="normal, warning, critical yoki storm")):
    """Simulyator rejimini o'zgartiradi. Misol: /simulator/mode?mode=storm"""
    if not simulator.set_mode(mode):
        raise HTTPException(
            status_code=400,
            detail=f"Yaroqsiz rejim. Variantlar: {', '.join(ACCEPTED_INPUT)}",
        )
    return {"status": "success", "current_mode": simulator.mode}
