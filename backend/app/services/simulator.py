"""Sun'iy telemetriya generatori (faqat demo/sinov uchun, barcha ma'lumot 'simulyatsiya')."""
import asyncio
import contextlib
import random
from datetime import datetime, timezone

from core import thresholds as T
from services.ingest import ingest

# "storm" – qulaylik uchun alias, ichki rejim "critical"
MODE_ALIASES = {"storm": "critical"}
MODES = ("normal", "warning", "critical")
ACCEPTED_INPUT = ("normal", "warning", "critical", "storm")


class TelemetrySimulator:
    def __init__(self, interval: float = 1.0, crew_id: str = T.DEFAULT_CREW_ID):
        self.mode = "normal"
        self.interval = interval
        self.crew_id = crew_id
        self._task: asyncio.Task | None = None

    def set_mode(self, mode: str) -> bool:
        mode = MODE_ALIASES.get(mode, mode)
        if mode not in MODES:
            return False
        self.mode = mode
        return True

    def generate_point(self) -> dict:
        timestamp = datetime.now(timezone.utc).isoformat()
        if self.mode == "normal":
            ranges = dict(hr=(65, 85), bp=(110, 125), rad=(0.05, 0.3), co2=(0.03, 0.05), sleep=(0.0, 2.0))
        elif self.mode == "warning":
            ranges = dict(hr=(95, 115), bp=(130, 145), rad=(1.0, 1.8), co2=(0.06, 0.09), sleep=(4.0, 6.0))
        else:
            ranges = dict(hr=(125, 150), bp=(150, 175), rad=(2.2, 4.5), co2=(0.1, 0.15), sleep=(6.0, 10.0))
        return {
            "timestamp": timestamp,
            "crew_id": self.crew_id,
            "heart_rate": round(random.uniform(*ranges["hr"]), 1),
            "blood_pressure_sys": round(random.uniform(*ranges["bp"]), 1),
            "radiation_level": round(random.uniform(*ranges["rad"]), 3),
            "co2_level": round(random.uniform(*ranges["co2"]), 3),
            "sleep_debt": round(random.uniform(*ranges["sleep"]), 1),
        }

    async def _run(self) -> None:
        while True:
            ingest(self.generate_point())
            await asyncio.sleep(self.interval)

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None


simulator = TelemetrySimulator()
