"""SQLite saqlash (stdlib, qo'shimcha paket kerak emas).

Jadvallar:
- samples: telemetriya namunalari. event_id PRIMARY KEY, shuning uchun takroriy yuborish idempotent.
- events: LOS_START, LOS_END, STATUS_CHANGE, ESCALATION, CHECKIN_NEED_HELP.
- checkins: ekipaj check-in'lari.
"""
import sqlite3
import threading
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS samples (
    event_id TEXT PRIMARY KEY,
    crew_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    received_at REAL NOT NULL,
    heart_rate REAL NOT NULL,
    blood_pressure_sys REAL NOT NULL,
    radiation_level REAL NOT NULL,
    co2_level REAL NOT NULL,
    sleep_debt REAL NOT NULL,
    dose_msv REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_samples_crew ON samples(crew_id, received_at);
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_crew ON events(crew_id, created_at);
CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checkins_crew ON checkins(crew_id, created_at);
"""

SCHEMA_EXTRA = """
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_id TEXT NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_crew ON notes(crew_id, created_at);
CREATE TABLE IF NOT EXISTS sync_marks (
    crew_id TEXT PRIMARY KEY,
    last_sync_at REAL NOT NULL,
    last_synced_count INTEGER NOT NULL
);
"""

SAMPLE_COLUMNS = (
    "heart_rate", "blood_pressure_sys", "radiation_level", "co2_level", "sleep_debt", "dose_msv"
)


class Storage:
    def __init__(self, path: str):
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        self._conn.executescript(SCHEMA + SCHEMA_EXTRA)

    def insert_sample(self, event_id, crew_id, mission_id, received_at, point) -> bool:
        """True: yangi yozildi. False: bu event_id avval bo'lgan (duplicate)."""
        with self._lock:
            cur = self._conn.execute(
                "INSERT OR IGNORE INTO samples (event_id, crew_id, mission_id, received_at, "
                "heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt, dose_msv) "
                "VALUES (?,?,?,?,?,?,?,?,?,?)",
                (event_id, crew_id, mission_id, received_at,
                 point["heart_rate"], point["blood_pressure_sys"], point["radiation_level"],
                 point["co2_level"], point["sleep_debt"], point["dose_msv"]),
            )
            self._conn.commit()
            return cur.rowcount == 1

    def load_recent_samples(self, crew_id: str, limit: int) -> list[dict]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM (SELECT * FROM samples WHERE crew_id = ? ORDER BY received_at DESC, rowid DESC LIMIT ?) "
                "ORDER BY received_at ASC, rowid ASC",
                (crew_id, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    def total_dose(self, crew_id: str) -> float:
        with self._lock:
            row = self._conn.execute(
                "SELECT COALESCE(SUM(dose_msv), 0) AS total FROM samples WHERE crew_id = ?", (crew_id,)
            ).fetchone()
        return float(row["total"])

    def known_crews(self) -> list[str]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT crew_id FROM samples UNION SELECT crew_id FROM checkins UNION SELECT crew_id FROM events"
            ).fetchall()
        return [r["crew_id"] for r in rows]

    def add_event(self, crew_id: str, kind: str, detail: str, at: float | None = None) -> None:
        with self._lock:
            self._conn.execute(
                "INSERT INTO events (crew_id, kind, detail, created_at) VALUES (?,?,?,?)",
                (crew_id, kind, detail, at if at is not None else time.time()),
            )
            self._conn.commit()

    def list_events(self, crew_id: str, limit: int = 50) -> list[dict]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT kind, detail, created_at FROM events WHERE crew_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
                (crew_id, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    def add_checkin(self, crew_id: str, status: str, note: str) -> float:
        now = time.time()
        with self._lock:
            self._conn.execute(
                "INSERT INTO checkins (crew_id, status, note, created_at) VALUES (?,?,?,?)",
                (crew_id, status, note, now),
            )
            self._conn.commit()
        return now

    def last_checkin(self, crew_id: str) -> dict | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT status, note, created_at FROM checkins WHERE crew_id = ? ORDER BY created_at DESC, id DESC LIMIT 1",
                (crew_id,),
            ).fetchone()
        return dict(row) if row else None

    def add_note(self, crew_id: str, author: str, text: str) -> dict:
        now = time.time()
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO notes (crew_id, author, text, created_at) VALUES (?,?,?,?)",
                (crew_id, author, text, now),
            )
            self._conn.commit()
            return {"id": cur.lastrowid, "crew_id": crew_id, "author": author, "text": text, "created_at": now}

    def list_notes(self, crew_id: str, limit: int = 50) -> list[dict]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT id, author, text, created_at FROM notes WHERE crew_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
                (crew_id, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    def search(self, crew_id: str, q: str, limit: int = 50) -> list[dict]:
        """Hodisalar, eslatmalar va check-in izohlari bo'yicha matnli qidiruv."""
        like = f"%{q}%"
        with self._lock:
            rows = self._conn.execute(
                "SELECT 'event' AS type, kind AS title, detail AS text, created_at FROM events "
                "WHERE crew_id = ? AND (kind LIKE ? OR detail LIKE ?) "
                "UNION ALL "
                "SELECT 'note', author, text, created_at FROM notes "
                "WHERE crew_id = ? AND (author LIKE ? OR text LIKE ?) "
                "UNION ALL "
                "SELECT 'checkin', status, note, created_at FROM checkins "
                "WHERE crew_id = ? AND note LIKE ? "
                "ORDER BY created_at DESC LIMIT ?",
                (crew_id, like, like, crew_id, like, like, crew_id, like, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    def history(self, crew_id: str, since: float | None, limit: int,
                hr_min: float | None, hr_max: float | None, rad_min: float | None) -> list[dict]:
        sql = "SELECT event_id, received_at, heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt FROM samples WHERE crew_id = ?"
        args: list = [crew_id]
        if since is not None:
            sql += " AND received_at >= ?"; args.append(since)
        if hr_min is not None:
            sql += " AND heart_rate >= ?"; args.append(hr_min)
        if hr_max is not None:
            sql += " AND heart_rate <= ?"; args.append(hr_max)
        if rad_min is not None:
            sql += " AND radiation_level >= ?"; args.append(rad_min)
        sql += " ORDER BY received_at DESC, rowid DESC LIMIT ?"
        args.append(limit)
        with self._lock:
            rows = self._conn.execute(sql, args).fetchall()
        return [dict(r) for r in rows]

    def latest_sample(self, crew_id: str) -> dict | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt, received_at "
                "FROM samples WHERE crew_id = ? ORDER BY received_at DESC, rowid DESC LIMIT 1",
                (crew_id,),
            ).fetchone()
        return dict(row) if row else None

    def last_sync(self, crew_id: str) -> dict | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT last_sync_at, last_synced_count FROM sync_marks WHERE crew_id = ?", (crew_id,)
            ).fetchone()
        return dict(row) if row else None

    def pending_samples(self, crew_id: str) -> int:
        """Oxirgi sinxronizatsiyadan keyin yer stansiyasiga hali yuborilmagan namunalar soni."""
        last = self.last_sync(crew_id)
        since = last["last_sync_at"] if last else 0.0
        with self._lock:
            row = self._conn.execute(
                "SELECT COUNT(*) AS n FROM samples WHERE crew_id = ? AND received_at > ?", (crew_id, since)
            ).fetchone()
        return int(row["n"])

    def mark_synced(self, crew_id: str, count: int) -> float:
        now = time.time()
        with self._lock:
            self._conn.execute(
                "INSERT INTO sync_marks (crew_id, last_sync_at, last_synced_count) VALUES (?,?,?) "
                "ON CONFLICT(crew_id) DO UPDATE SET last_sync_at = excluded.last_sync_at, "
                "last_synced_count = excluded.last_synced_count",
                (crew_id, now, count),
            )
            self._conn.commit()
        return now

    def clear(self) -> None:
        """Faqat testlar uchun."""
        with self._lock:
            for table in ("samples", "events", "checkins", "notes", "sync_marks"):
                self._conn.execute(f"DELETE FROM {table}")
            self._conn.commit()
