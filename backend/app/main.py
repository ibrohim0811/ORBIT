import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Add backend/app directory to sys.path so imports work regardless of CWD
APP_DIR = Path(__file__).resolve().parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.features import router as features_router
from api.simulator import router as simulator_router
from api.telemetry import router as telemetry_router
from api.websocket import router as ws_router
from services.monitor import monitor
from services.simulator import simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    await simulator.start()
    await monitor.start()
    yield
    await monitor.stop()
    await simulator.stop()


app = FastAPI(
    title="ORBIT - Space Health Monitoring System",
    version="1.1.0",
    lifespan=lifespan,
)

# "*" + allow_credentials=True brauzerda rad etiladi. Shu sababli credentials o'chirilgan
# va bo'sh ro'yxat bo'lsa "*" o'rniga lokal frontend manzili ishlatiladi.
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
] or ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(telemetry_router)
app.include_router(ws_router)
app.include_router(simulator_router)
app.include_router(features_router)


@app.get("/")
async def root():
    return {"message": "ORBIT is working..."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=os.getenv("RELOAD") == "1")
