"""PostgreSQL saqlash (psycopg 3). Ulanish DATABASE_URL orqali beriladi.

Jadvallar:
- samples: telemetriya namunalari. event_id UNIQUE, shuning uchun takroriy yuborish idempotent.
- events: STATUS_CHANGE, LOS_START, LOS_END, ESCALATION.
- checkins: ekipaj check-in'lari.
- notes: ekipaj eslatmalari (Notes/Logs).
- sync_marks: oxirgi yer stansiyasi sinxronizatsiyasi.
"""
import threading
import time

import psycopg
from psycopg.rows import dict_row

SCHEMA_STATEMENTS = [
    """CREATE TABLE IF NOT EXISTS samples (
        id BIGSERIAL PRIMARY KEY,
        event_id TEXT UNIQUE NOT NULL,
        crew_id TEXT NOT NULL,
        mission_id TEXT NOT NULL,
        received_at DOUBLE PRECISION NOT NULL,
        heart_rate DOUBLE PRECISION NOT NULL,
        blood_pressure_sys DOUBLE PRECISION NOT NULL,
        radiation_level DOUBLE PRECISION NOT NULL,
        co2_level DOUBLE PRECISION NOT NULL,
        sleep_debt DOUBLE PRECISION NOT NULL,
        dose_msv DOUBLE PRECISION NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_samples_crew ON samples (crew_id, received_at)",
    """CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        crew_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        detail TEXT NOT NULL,
        created_at DOUBLE PRECISION NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_events_crew ON events (crew_id, created_at)",
    """CREATE TABLE IF NOT EXISTS checkins (
        id BIGSERIAL PRIMARY KEY,
        crew_id TEXT NOT NULL,
        status TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at DOUBLE PRECISION NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_checkins_crew ON checkins (crew_id, created_at)",
    """CREATE TABLE IF NOT EXISTS notes (
        id BIGSERIAL PRIMARY KEY,
        crew_id TEXT NOT NULL,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at DOUBLE PRECISION NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_notes_crew ON notes (crew_id, created_at)",
    """CREATE TABLE IF NOT EXISTS sync_marks (
        crew_id TEXT PRIMARY KEY,
        last_sync_at DOUBLE PRECISION NOT NULL,
        last_synced_count INTEGER NOT NULL
    )""",
]


def normalize_url(url: str) -> str:
    """SQLAlchemy uslubidagi 'postgresql+asyncpg://' ni psycopg uchun oddiy 'postgresql://' ga aylantiradi."""
    for prefix in ("postgresql+asyncpg://", "postgresql+psycopg://", "postgresql+psycopg2://"):
        if url.startswith(prefix):
            return "postgresql://" + url[len(prefix):]
    return url


class Storage:
    def __init__(self, url: str):
        self._conn = psycopg.connect(normalize_url(url), autocommit=True, row_factory=dict_row)
        self._lock = threading.Lock()
        with self._conn.cursor() as cur:
            for stmt in SCHEMA_STATEMENTS:
                cur.execute(stmt)

    def _execute(self, sql: str, params=()):
        with self._lock:
            return self._conn.execute(sql, params)

    def insert_sample(self, event_id, crew_id, mission_id, received_at, point) -> bool:
        """True: yangi yozildi. False: bu event_id avval bo'lgan (duplicate)."""
        cur = self._execute(
            "INSERT INTO samples (event_id, crew_id, mission_id, received_at, heart_rate, blood_pressure_sys, "
            "radiation_level, co2_level, sleep_debt, dose_msv) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (event_id) DO NOTHING",
            (event_id, crew_id, mission_id, received_at,
             point["heart_rate"], point["blood_pressure_sys"], point["radiation_level"],
             point["co2_level"], point["sleep_debt"], point["dose_msv"]),
        )
        return cur.rowcount == 1

    def load_recent_samples(self, crew_id: str, limit: int) -> list[dict]:
        rows = self._execute(
            "SELECT * FROM (SELECT heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt, "
            "dose_msv, received_at, id FROM samples WHERE crew_id = %s ORDER BY received_at DESC, id DESC LIMIT %s) t "
            "ORDER BY received_at ASC, id ASC",
            (crew_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def total_dose(self, crew_id: str) -> float:
        row = self._execute(
            "SELECT COALESCE(SUM(dose_msv), 0) AS total FROM samples WHERE crew_id = %s", (crew_id,)
        ).fetchone()
        return float(row["total"])

    def known_crews(self) -> list[str]:
        rows = self._execute(
            "SELECT crew_id FROM samples UNION SELECT crew_id FROM checkins UNION SELECT crew_id FROM events"
        ).fetchall()
        return [r["crew_id"] for r in rows]

    def add_event(self, crew_id: str, kind: str, detail: str, at: float | None = None) -> None:
        self._execute(
            "INSERT INTO events (crew_id, kind, detail, created_at) VALUES (%s,%s,%s,%s)",
            (crew_id, kind, detail, at if at is not None else time.time()),
        )

    def list_events(self, crew_id: str, limit: int = 50) -> list[dict]:
        rows = self._execute(
            "SELECT kind, detail, created_at FROM events WHERE crew_id = %s ORDER BY created_at DESC, id DESC LIMIT %s",
            (crew_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def add_checkin(self, crew_id: str, status: str, note: str) -> float:
        now = time.time()
        self._execute(
            "INSERT INTO checkins (crew_id, status, note, created_at) VALUES (%s,%s,%s,%s)",
            (crew_id, status, note, now),
        )
        return now

    def last_checkin(self, crew_id: str) -> dict | None:
        row = self._execute(
            "SELECT status, note, created_at FROM checkins WHERE crew_id = %s ORDER BY created_at DESC, id DESC LIMIT 1",
            (crew_id,),
        ).fetchone()
        return dict(row) if row else None

    def add_note(self, crew_id: str, author: str, text: str) -> dict:
        now = time.time()
        row = self._execute(
            "INSERT INTO notes (crew_id, author, text, created_at) VALUES (%s,%s,%s,%s) RETURNING id",
            (crew_id, author, text, now),
        ).fetchone()
        return {"id": row["id"], "crew_id": crew_id, "author": author, "text": text, "created_at": now}

    def list_notes(self, crew_id: str, limit: int = 50) -> list[dict]:
        rows = self._execute(
            "SELECT id, author, text, created_at FROM notes WHERE crew_id = %s ORDER BY created_at DESC, id DESC LIMIT %s",
            (crew_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def count_notes(self, crew_id: str) -> int:
        row = self._execute("SELECT COUNT(*) AS n FROM notes WHERE crew_id = %s", (crew_id,)).fetchone()
        return int(row["n"]) if row else 0

    def prune_old_samples(self, max_age_seconds: float = 86400.0 * 2) -> int:
        """Eskirgan namunalarni tozalash (jadval cheksiz o'sishining oldini oladi)."""
        cutoff = time.time() - max_age_seconds
        cur = self._execute("DELETE FROM samples WHERE received_at < %s", (cutoff,))
        return cur.rowcount

    def search(self, crew_id: str, q: str, limit: int = 50) -> list[dict]:
        """Hodisalar, eslatmalar va check-in izohlari bo'yicha matnli qidiruv."""
        like = f"%{q}%"
        rows = self._execute(
            "SELECT 'event' AS type, kind AS title, detail AS text, created_at FROM events "
            "WHERE crew_id = %s AND (kind ILIKE %s OR detail ILIKE %s) "
            "UNION ALL "
            "SELECT 'note', author, text, created_at FROM notes "
            "WHERE crew_id = %s AND (author ILIKE %s OR text ILIKE %s) "
            "UNION ALL "
            "SELECT 'checkin', status, note, created_at FROM checkins "
            "WHERE crew_id = %s AND note ILIKE %s "
            "ORDER BY created_at DESC LIMIT %s",
            (crew_id, like, like, crew_id, like, like, crew_id, like, limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def history(self, crew_id: str, since: float | None, limit: int,
                hr_min: float | None, hr_max: float | None, rad_min: float | None) -> list[dict]:
        sql = ("SELECT event_id, received_at, heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt "
               "FROM samples WHERE crew_id = %s")
        args: list = [crew_id]
        if since is not None:
            sql += " AND received_at >= %s"; args.append(since)
        if hr_min is not None:
            sql += " AND heart_rate >= %s"; args.append(hr_min)
        if hr_max is not None:
            sql += " AND heart_rate <= %s"; args.append(hr_max)
        if rad_min is not None:
            sql += " AND radiation_level >= %s"; args.append(rad_min)
        sql += " ORDER BY received_at DESC, id DESC LIMIT %s"
        args.append(limit)
        return [dict(r) for r in self._execute(sql, args).fetchall()]

    def latest_sample(self, crew_id: str) -> dict | None:
        row = self._execute(
            "SELECT heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt, received_at "
            "FROM samples WHERE crew_id = %s ORDER BY received_at DESC, id DESC LIMIT 1",
            (crew_id,),
        ).fetchone()
        return dict(row) if row else None

    def last_sync(self, crew_id: str) -> dict | None:
        row = self._execute(
            "SELECT last_sync_at, last_synced_count FROM sync_marks WHERE crew_id = %s", (crew_id,)
        ).fetchone()
        return dict(row) if row else None

    def pending_samples(self, crew_id: str) -> int:
        """Oxirgi sinxronizatsiyadan keyin yer stansiyasiga hali yuborilmagan namunalar soni."""
        last = self.last_sync(crew_id)
        since = last["last_sync_at"] if last else 0.0
        row = self._execute(
            "SELECT COUNT(*) AS n FROM samples WHERE crew_id = %s AND received_at > %s", (crew_id, since)
        ).fetchone()
        return int(row["n"])

    def mark_synced(self, crew_id: str, count: int) -> float:
        now = time.time()
        self._execute(
            "INSERT INTO sync_marks (crew_id, last_sync_at, last_synced_count) VALUES (%s,%s,%s) "
            "ON CONFLICT (crew_id) DO UPDATE SET last_sync_at = EXCLUDED.last_sync_at, "
            "last_synced_count = EXCLUDED.last_synced_count",
            (crew_id, now, count),
        )
        return now

    def clear(self) -> None:
        """Faqat testlar uchun."""
        for table in ("samples", "events", "checkins", "notes", "sync_marks"):
            self._execute(f"TRUNCATE {table}")
