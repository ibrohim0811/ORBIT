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
    blood_glucose_mgdl REAL NOT NULL DEFAULT 95.0,
    body_temp_c REAL NOT NULL DEFAULT 36.8,
    sleep_hours_last_night REAL NOT NULL DEFAULT 8.0,
    mood INTEGER DEFAULT 4,
    blood_sugar REAL NOT NULL DEFAULT 95.0,
    body_temperature REAL NOT NULL DEFAULT 36.8,
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
    mood INTEGER DEFAULT 4,
    symptoms TEXT DEFAULT '',
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
CREATE TABLE IF NOT EXISTS crew_gamification (
    crew_id TEXT PRIMARY KEY,
    streak_days INTEGER NOT NULL DEFAULT 1,
    total_points INTEGER NOT NULL DEFAULT 100,
    last_completed_date TEXT
);
CREATE TABLE IF NOT EXISTS crew_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 20,
    completed INTEGER NOT NULL DEFAULT 0,
    date_key TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_task_unique ON crew_tasks(crew_id, task_id, date_key);
CREATE TABLE IF NOT EXISTS crew_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked_at REAL NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_badge_unique ON crew_badges(crew_id, badge_id);
"""

SAMPLE_COLUMNS = (
    "heart_rate", "blood_pressure_sys", "radiation_level", "co2_level", "sleep_debt",
    "blood_glucose_mgdl", "body_temp_c", "sleep_hours_last_night", "mood",
    "blood_sugar", "body_temperature", "dose_msv"
)

DEFAULT_TASKS = [
    {
        "task_id": "task_exercise",
        "title": "Trenajyor 2.5 soat",
        "description": "T2 Treadmill & ARED kuch mashqlari (suyak va mushak atrofiyasi profilaktikasi)",
        "category": "fitness",
        "points": 30,
    },
    {
        "task_id": "task_hydration",
        "title": "Suv ichish",
        "description": "2.5L ionlashtirilgan suv iste'moli va elektrolit balansi nazorati",
        "category": "hydration",
        "points": 20,
    },
    {
        "task_id": "task_sleep",
        "title": "Uyqu",
        "description": "Kamida 7-8 soatlik to'liq sirkad uyqu va dam olish",
        "category": "recovery",
        "points": 25,
    },
    {
        "task_id": "task_measurement",
        "title": "O'lchov olish",
        "description": "Telemetriya va hayotiy ko'rsatkichlarni tekshirish",
        "category": "safety",
        "points": 15,
    },
    {
        "task_id": "task_checkin",
        "title": "Check-in",
        "description": "Kunlik salomatlik va ruhiy holat bo'yicha hisobot",
        "category": "health",
        "points": 25,
    },
]

ALL_BADGES = [
    {
        "badge_id": "rad_shield",
        "title": "Radiation Shield Master",
        "description": "Radiatsiya foni va dozimetriya doimiy nazoratda",
        "icon": "Shield",
    },
    {
        "badge_id": "hydration_hero",
        "title": "Hydration Hero",
        "description": "Kunlik suv balansi va elektrolit me'yori to'liq bajarildi",
        "icon": "Droplets",
    },
    {
        "badge_id": "sleep_guardian",
        "title": "Sleep Guardian",
        "description": "Uyqu gigiyenasi saqlangan, uyqu qarzi minimal",
        "icon": "Moon",
    },
    {
        "badge_id": "fitness_commander",
        "title": "Fitness Commander",
        "description": "2.5 soatlik kosmik trenajyor mashqlari muvaffaqiyatli yakunlandi",
        "icon": "Flame",
    },
    {
        "badge_id": "streak_master",
        "title": "Orbit Pioneer (Streak)",
        "description": "Ketma-ket 5 kunlik barcha vazifalar a'lo darajada bajarildi",
        "icon": "Award",
    },
]


class Storage:
    def __init__(self, path: str):
        self._conn = sqlite3.connect(path, timeout=30.0, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        try:
            self._conn.execute("PRAGMA journal_mode=WAL;")
            self._conn.execute("PRAGMA synchronous=NORMAL;")
            self._conn.execute("PRAGMA busy_timeout=30000;")
        except Exception:
            pass
        self._conn.executescript(SCHEMA + SCHEMA_EXTRA)

        # Dinamik ustunlar migratsiyasi (mavjud orbit.db ni buzmaslik uchun)
        sample_migrations = [
            ("blood_glucose_mgdl", "REAL NOT NULL DEFAULT 95.0"),
            ("body_temp_c", "REAL NOT NULL DEFAULT 36.8"),
            ("sleep_hours_last_night", "REAL NOT NULL DEFAULT 8.0"),
            ("mood", "INTEGER DEFAULT 4"),
            ("blood_sugar", "REAL NOT NULL DEFAULT 95.0"),
            ("body_temperature", "REAL NOT NULL DEFAULT 36.8"),
        ]
        for col, col_def in sample_migrations:
            try:
                self._conn.execute(f"ALTER TABLE samples ADD COLUMN {col} {col_def};")
            except Exception:
                pass

        checkin_migrations = [
            ("mood", "INTEGER DEFAULT 4"),
            ("symptoms", "TEXT DEFAULT ''"),
        ]
        for col, col_def in checkin_migrations:
            try:
                self._conn.execute(f"ALTER TABLE checkins ADD COLUMN {col} {col_def};")
            except Exception:
                pass

    def insert_sample(self, event_id, crew_id, mission_id, received_at, point) -> bool:
        """True: yangi yozildi. False: bu event_id avval bo'lgan (duplicate)."""
        glucose = float(point.get("blood_glucose_mgdl", point.get("blood_sugar", 95.0)))
        temp = float(point.get("body_temp_c", point.get("body_temperature", 36.8)))
        sleep_hours = float(point.get("sleep_hours_last_night", 8.0))
        mood = point.get("mood")
        with self._lock:
            cur = self._conn.execute(
                "INSERT OR IGNORE INTO samples (event_id, crew_id, mission_id, received_at, "
                "heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt, "
                "blood_glucose_mgdl, body_temp_c, sleep_hours_last_night, mood, "
                "blood_sugar, body_temperature, dose_msv) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (event_id, crew_id, mission_id, received_at,
                 point["heart_rate"], point["blood_pressure_sys"], point["radiation_level"],
                 point["co2_level"], point["sleep_debt"],
                 glucose, temp, sleep_hours, mood,
                 glucose, temp,
                 point["dose_msv"]),
            )
            self._conn.commit()
            return cur.rowcount == 1

    def load_recent_samples(self, crew_id: str, limit: int) -> list[dict]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM (SELECT *, rowid FROM samples WHERE crew_id = ? ORDER BY received_at DESC, rowid DESC LIMIT ?) "
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

    def add_checkin(self, crew_id: str, status: str, note: str, mood: int | None = None, symptoms: list[str] | str | None = None) -> float:
        now = time.time()
        symptoms_str = ",".join(symptoms) if isinstance(symptoms, list) else (symptoms or "")
        with self._lock:
            self._conn.execute(
                "INSERT INTO checkins (crew_id, status, note, mood, symptoms, created_at) VALUES (?,?,?,?,?,?)",
                (crew_id, status, note, mood if mood is not None else 4, symptoms_str, now),
            )
            self._conn.commit()
        return now

    def last_checkin(self, crew_id: str) -> dict | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT status, note, mood, symptoms, created_at FROM checkins WHERE crew_id = ? ORDER BY created_at DESC, id DESC LIMIT 1",
                (crew_id,),
            ).fetchone()
        return dict(row) if row else None

    def recent_checkins(self, crew_id: str, limit: int = 10) -> list[dict]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT status, note, mood, symptoms, created_at FROM checkins WHERE crew_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
                (crew_id, limit),
            ).fetchall()
        return [dict(r) for r in rows]

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

    def count_notes(self, crew_id: str) -> int:
        with self._lock:
            row = self._conn.execute(
                "SELECT COUNT(*) AS n FROM notes WHERE crew_id = ?", (crew_id,)
            ).fetchone()
        return int(row["n"]) if row else 0

    def prune_old_samples(self, max_age_seconds: float = 86400.0 * 2) -> int:
        """Eskirgan namunalarni tozalash (xotira va disk cheksiz o'sishining oldini oladi)."""
        cutoff = time.time() - max_age_seconds
        with self._lock:
            cur = self._conn.execute("DELETE FROM samples WHERE received_at < ?", (cutoff,))
            self._conn.commit()
            return cur.rowcount

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
        sql = ("SELECT event_id, received_at, heart_rate, blood_pressure_sys, radiation_level, "
               "co2_level, sleep_debt, blood_glucose_mgdl, body_temp_c, sleep_hours_last_night, mood, "
               "blood_sugar, body_temperature FROM samples WHERE crew_id = ?")
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
                "SELECT heart_rate, blood_pressure_sys, radiation_level, co2_level, sleep_debt, "
                "blood_glucose_mgdl, body_temp_c, sleep_hours_last_night, mood, "
                "blood_sugar, body_temperature, received_at "
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

    def get_gamification_state(self, crew_id: str) -> dict:
        today_key = time.strftime("%Y-%m-%d", time.gmtime())
        with self._lock:
            row = self._conn.execute(
                "SELECT streak_days, total_points, last_completed_date FROM crew_gamification WHERE crew_id = ?",
                (crew_id,),
            ).fetchone()
            if not row:
                self._conn.execute(
                    "INSERT INTO crew_gamification (crew_id, streak_days, total_points, last_completed_date) "
                    "VALUES (?, 5, 240, ?)",
                    (crew_id, today_key),
                )
                self._conn.commit()
                streak_days = 5
                total_points = 240
            else:
                streak_days = int(row["streak_days"])
                total_points = int(row["total_points"])

            task_rows = self._conn.execute(
                "SELECT task_id, title, description, category, points, completed FROM crew_tasks "
                "WHERE crew_id = ? AND date_key = ? ORDER BY id ASC",
                (crew_id, today_key),
            ).fetchall()

            if not task_rows:
                for dt in DEFAULT_TASKS:
                    self._conn.execute(
                        "INSERT OR IGNORE INTO crew_tasks (crew_id, task_id, title, description, category, points, completed, date_key) "
                        "VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
                        (crew_id, dt["task_id"], dt["title"], dt["description"], dt["category"], dt["points"], today_key),
                    )
                self._conn.commit()
                task_rows = self._conn.execute(
                    "SELECT task_id, title, description, category, points, completed FROM crew_tasks "
                    "WHERE crew_id = ? AND date_key = ? ORDER BY id ASC",
                    (crew_id, today_key),
                ).fetchall()

            tasks = [
                {
                    "task_id": r["task_id"],
                    "title": r["title"],
                    "description": r["description"],
                    "category": r["category"],
                    "points": int(r["points"]),
                    "completed": bool(r["completed"]),
                }
                for r in task_rows
            ]

            unlocked_rows = self._conn.execute(
                "SELECT badge_id, unlocked_at FROM crew_badges WHERE crew_id = ?",
                (crew_id,),
            ).fetchall()
            unlocked_map = {r["badge_id"]: r["unlocked_at"] for r in unlocked_rows}

            if not unlocked_map:
                now_ts = time.time()
                for bid in ("rad_shield", "hydration_hero"):
                    self._conn.execute(
                        "INSERT OR IGNORE INTO crew_badges (crew_id, badge_id, title, description, icon, unlocked_at) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        (crew_id, bid, next(b["title"] for b in ALL_BADGES if b["badge_id"] == bid),
                         next(b["description"] for b in ALL_BADGES if b["badge_id"] == bid),
                         next(b["icon"] for b in ALL_BADGES if b["badge_id"] == bid),
                         now_ts),
                    )
                self._conn.commit()
                unlocked_rows = self._conn.execute(
                    "SELECT badge_id, unlocked_at FROM crew_badges WHERE crew_id = ?",
                    (crew_id,),
                ).fetchall()
                unlocked_map = {r["badge_id"]: r["unlocked_at"] for r in unlocked_rows}

            badges = [
                {
                    **b,
                    "unlocked": b["badge_id"] in unlocked_map,
                    "unlocked_at": unlocked_map.get(b["badge_id"]),
                }
                for b in ALL_BADGES
            ]

        completed_count = sum(1 for t in tasks if t["completed"])
        return {
            "crew_id": crew_id,
            "streak_days": streak_days,
            "total_points": total_points,
            "date": today_key,
            "tasks_completed": completed_count,
            "tasks_total": len(tasks),
            "tasks": tasks,
            "badges": badges,
        }

    def toggle_task(self, crew_id: str, task_id: str, completed: bool) -> dict:
        today_key = time.strftime("%Y-%m-%d", time.gmtime())
        with self._lock:
            # Ensure today's tasks exist first
            existing = self._conn.execute(
                "SELECT id FROM crew_tasks WHERE crew_id = ? AND task_id = ? AND date_key = ?",
                (crew_id, task_id, today_key),
            ).fetchone()
            if not existing:
                for dt in DEFAULT_TASKS:
                    self._conn.execute(
                        "INSERT OR IGNORE INTO crew_tasks (crew_id, task_id, title, description, category, points, completed, date_key) "
                        "VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
                        (crew_id, dt["task_id"], dt["title"], dt["description"], dt["category"], dt["points"], today_key),
                    )

            self._conn.execute(
                "UPDATE crew_tasks SET completed = ? WHERE crew_id = ? AND task_id = ? AND date_key = ?",
                (1 if completed else 0, crew_id, task_id, today_key),
            )

            row = self._conn.execute(
                "SELECT points FROM crew_tasks WHERE crew_id = ? AND task_id = ? AND date_key = ?",
                (crew_id, task_id, today_key),
            ).fetchone()
            pts = int(row["points"]) if row else 20
            delta = pts if completed else -pts

            self._conn.execute(
                "UPDATE crew_gamification SET total_points = MAX(0, total_points + ?) WHERE crew_id = ?",
                (delta, crew_id),
            )

            all_rows = self._conn.execute(
                "SELECT completed FROM crew_tasks WHERE crew_id = ? AND date_key = ?",
                (crew_id, today_key),
            ).fetchall()
            all_done = bool(all_rows) and all(bool(r["completed"]) for r in all_rows)
            if all_done:
                self._conn.execute(
                    "UPDATE crew_gamification SET streak_days = streak_days + 1, last_completed_date = ? "
                    "WHERE crew_id = ? AND last_completed_date != ?",
                    (today_key, crew_id, today_key),
                )
                now_ts = time.time()
                self._conn.execute(
                    "INSERT OR IGNORE INTO crew_badges (crew_id, badge_id, title, description, icon, unlocked_at) "
                    "VALUES (?, 'streak_master', 'Orbit Pioneer (Streak)', 'Ketma-ket barcha vazifalar yakunlandi', 'Award', ?)",
                    (crew_id, now_ts),
                )

            if completed:
                now_ts = time.time()
                badge_map = {
                    "task_exercise": ("fitness_commander", "Fitness Commander", "Trenajyor mashqlari bajarildi", "Flame"),
                    "task_hydration": ("hydration_hero", "Hydration Hero", "Suv balansi bajarildi", "Droplets"),
                    "task_sleep": ("sleep_guardian", "Sleep Guardian", "Uyqu davri saqlangan", "Moon"),
                    "task_measurement": ("rad_shield", "Vitals & Radiation Master", "O'lchov olish va telemetriya nazorati bajarildi", "Shield"),
                    "task_radiation": ("rad_shield", "Radiation Shield Master", "Radiatsiya nazorati bajarildi", "Shield"),
                }
                if task_id in badge_map:
                    bid, title, desc, icon = badge_map[task_id]
                    self._conn.execute(
                        "INSERT OR IGNORE INTO crew_badges (crew_id, badge_id, title, description, icon, unlocked_at) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        (crew_id, bid, title, desc, icon, now_ts),
                    )

            self._conn.commit()

        return self.get_gamification_state(crew_id)

    def reset_gamification(self, crew_id: str) -> dict:
        today_key = time.strftime("%Y-%m-%d", time.gmtime())
        with self._lock:
            self._conn.execute("DELETE FROM crew_tasks WHERE crew_id = ?", (crew_id,))
            self._conn.execute("DELETE FROM crew_badges WHERE crew_id = ?", (crew_id,))
            self._conn.execute(
                "INSERT INTO crew_gamification (crew_id, streak_days, total_points, last_completed_date) "
                "VALUES (?, 5, 240, ?) "
                "ON CONFLICT(crew_id) DO UPDATE SET streak_days = 5, total_points = 240, last_completed_date = ?",
                (crew_id, today_key, today_key),
            )
            self._conn.commit()
        return self.get_gamification_state(crew_id)

    def clear(self) -> None:
        """Faqat testlar uchun."""
        with self._lock:
            for table in ("samples", "events", "checkins", "notes", "sync_marks", "crew_gamification", "crew_tasks", "crew_badges"):
                self._conn.execute(f"DELETE FROM {table}")
            self._conn.commit()
