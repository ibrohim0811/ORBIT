"""Holat o'tishlarini kuzatadi va hodisalarni bazaga yozadi.

Yozadigan hodisalar:
- STATUS_CHANGE: NORMAL / WARNING / CRITICAL / STALE o'zgarishi
- LOS_START / LOS_END: aloqa uzilishi (STALE) boshlanishi va tugashi
- ESCALATION: CRITICAL holat CHECKIN_TIMEOUT_S dan oshdi va check-in bo'lmadi
"""
import asyncio
import contextlib
import time
from typing import Callable

from core import thresholds as T
from services import state


class Monitor:
    def __init__(self, clock: Callable[[], float] = time.time):
        self._clock = clock
        self._prev: dict[str, str] = {}
        self._critical_since: dict[str, float] = {}
        self._escalated: set[str] = set()
        self._task: asyncio.Task | None = None
        self._last_prune: float = 0.0

    def tick(self) -> None:
        now = self._clock()
        storage = state.storage

        # Eskirgan namunalarni vaqti-vaqti bilan tozalash (soatiga bir marta)
        if now - self._last_prune > 3600.0:
            try:
                storage.prune_old_samples()
                self._last_prune = now
            except Exception:
                pass

        for crew in state.known_crews():
            stats = state.get_analyzer(crew).get_statistics()
            status = stats["system_status"] if stats else "STALE"
            prev = self._prev.get(crew)

            if prev is not None and prev != status:
                if status == "STALE":
                    storage.add_event(crew, "LOS_START", "Aloqa uzildi (ma'lumot kelmayapti)", now)
                elif prev == "STALE":
                    storage.add_event(crew, "LOS_END", "Aloqa tiklandi", now)
                else:
                    storage.add_event(crew, "STATUS_CHANGE", f"{prev} -> {status}", now)

            if status == "CRITICAL":
                since = self._critical_since.setdefault(crew, now)
                checked_in = self._checked_in_since(crew, since)
                if (crew not in self._escalated
                        and not checked_in
                        and now - since > T.CHECKIN_TIMEOUT_S):
                    storage.add_event(crew, "ESCALATION",
                                      "CRITICAL holat, check-in yo'q: yerdagi nazorat xabardor qilinsin", now)
                    self._escalated.add(crew)
            else:
                self._critical_since.pop(crew, None)
                self._escalated.discard(crew)

            self._prev[crew] = status

    def _checked_in_since(self, crew: str, since: float) -> bool:
        last = state.storage.last_checkin(crew)
        return bool(last and last["created_at"] >= since and last.get("status") == "OK")

    async def _run(self) -> None:
        while True:
            self.tick()
            await asyncio.sleep(T.MONITOR_INTERVAL_S)

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None


monitor = Monitor()
