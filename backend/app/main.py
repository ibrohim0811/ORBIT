import os
from contextlib import asynccontextmanager

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

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
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
