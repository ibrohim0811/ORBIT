"""Ollama (lokal LLM) bilan aloqa. Ollama o'chiq bo'lsa, qoidaga asoslangan javobga qaytadi.

Muhit o'zgaruvchilari: OLLAMA_URL (standart http://localhost:11434), OLLAMA_MODEL (standart llama3).
Faqat stdlib (urllib) ishlatiladi, qo'shimcha paket kerak emas.
"""
import json
import os
import time
import urllib.error
import urllib.request

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
_STATUS_CACHE: dict = {"at": 0.0, "value": None}
STATUS_TTL_S = 10.0


def ollama_status() -> dict:
    """Ollama ishlayaptimi (10 soniya keshlanadi, serverni har so'rovda urmaslik uchun)."""
    now = time.time()
    if _STATUS_CACHE["value"] is not None and now - _STATUS_CACHE["at"] < STATUS_TTL_S:
        return _STATUS_CACHE["value"]
    try:
        with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=2) as r:
            models = [m.get("name") for m in json.load(r).get("models", [])]
        value = {"engine": f"Ollama {OLLAMA_MODEL}", "state": "Active",
                 "model_available": any(OLLAMA_MODEL in (m or "") for m in models)}
    except (urllib.error.URLError, OSError, ValueError):
        value = {"engine": f"Ollama {OLLAMA_MODEL}", "state": "Offline", "model_available": False}
    _STATUS_CACHE.update(at=now, value=value)
    return value


def ask_ollama(prompt: str) -> str | None:
    """Ollama'dan javob. Xato bo'lsa None (chaqiruvchi zaxira javobni ishlatadi)."""
    body = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}).encode()
    req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r).get("response", "").strip() or None
    except (urllib.error.URLError, OSError, ValueError):
        return None


def build_prompt(question: str, status: dict | None, recent_events: list[dict]) -> str:
    lines = [
        "Siz ORBIT kosmik ekipaj salomatligi tizimining yordamchisisiz. Faqat o'zbek tilida, qisqa javob bering.",
        "Muhim: tibbiy yoki holat qarorlarini siz qabul qilmaysiz, ular qoida asosida hisoblanadi. Faqat tushuntiring.",
    ]
    if status:
        lines.append(f"Joriy holat: {status.get('system_status')}. "
                     f"Tavsiya: {status.get('recommendation', {}).get('action', '')}")
        lines.append(f"Ko'rsatkichlar: {json.dumps(status.get('metrics', {}), ensure_ascii=False)}")
    if recent_events:
        lines.append("So'nggi hodisalar: " + "; ".join(f"{e['kind']}: {e['detail']}" for e in recent_events[:5]))
    lines.append(f"Ekipaj savoli: {question}")
    return "\n".join(lines)


def fallback_answer(status: dict | None) -> str:
    if not status:
        return "Hozircha telemetriya ma'lumoti yo'q. Sensor ulanishini tekshiring."
    rec = status.get("recommendation", {})
    return (f"AI (Ollama) hozir mavjud emas, shuning uchun qoida asosidagi javob: "
            f"holat {status.get('system_status')}. {rec.get('action', '')} Sabab: {rec.get('reason', '')}")
