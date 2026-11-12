from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

#routers
from api.telemetry import router as telemetry
from api.websocket import router as ws
from api.simulator import router as simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Server yoqilganda simulyatorni avtomatik ishga tushiramiz
    simulator.start()
    yield
    # Server o'chganda simulyatorni to'xtatamiz
    simulator.stop()

app = FastAPI(
    title="ORBIT - Space Health Monitoring System",
    version="1.0.0",
    lifespan=lifespan
)


# CORS sozlamalari (Frontend erkin murojaat qilishi uchun)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hozircha barcha manbalarga ruxsat (keyinchalik aniq domain/portni yozish mumkin)
    allow_credentials=True,
    allow_methods=["*"],  # Barcha metodlarga ruxsat (GET, POST, h.k.)
    allow_headers=["*"],  # Barcha header'larga ruxsat
)

app.include_router(telemetry)
app.include_router(ws)
app.include_router(simulator)


@app.get('/')
async def get():
    return {"message":"ORBIT is working..."}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)