# ORBIT: Orbital Real-time Biomedical & Telemetry
**Analyze · Understand · Protect**
*When Earth is far, your data keeps you close.*

NASA Space Apps Challenge 2026: Create Health Monitoring Software for Astronauts on Space Missions

## The problem
On long missions to the Moon and Mars, astronauts face radiation, isolation, communication delay, altered gravity and a closed environment. These hazards change blood pressure, heart rate, glucose, temperature, sleep and mood. With a communication delay, a flight surgeon cannot always respond in time, so the crew must be able to assess their own health.

## Our solution
ORBIT is an offline-first health monitoring and decision-support tool that works on board, without internet. It collects health indicators, compares them with documented thresholds, explains each alert in plain language, prompts crew check-ins, and records everything for post-mission medical review.

## Key features
- **Interactive anatomy.** Click the brain, heart, lungs or skeleton to see that system's function, current indicators, status and recommended actions.
- **Live vitals dashboard.** Heart rate, blood pressure, blood glucose, body temperature, sleep, mood, radiation and cabin CO₂ with dynamic charts and green / amber / red status at a glance.
- **Explainable rule engine.** Every alert shows which rule fired, which value triggered it and what to do. A status changes only after 3 consecutive confirming samples, so single sensor spikes do not cause false alarms.
- **Crew check-in.** When a concerning pattern appears, ORBIT asks "Are you okay?" and records OK / NEED HELP, mood and symptoms. A "NEED HELP" answer never cancels an escalation. A missing response escalates.
- **Local AI assistant (optional).** A pre-downloaded Ollama model explains findings in plain language. It never decides risk. If Ollama is off, rule-based answers take over.
- **Loss-of-signal handling.** No data is never shown as "normal". The state becomes STALE, readings are queued locally and synced when the link returns.
- **Medical guide.** For each of NASA's five spaceflight hazards: which indicators it affects, why they are measured, when to contact flight surgeons and how to prevent problems.
- **Gamification.** Daily health tasks (exercise, hydration, sleep, measurements, check-in), points, streaks and badges keep the crew engaged.
- **Environments.** Switch between spacecraft, station, rover and surface base profiles.
- **Post-mission report.** Chronological event timeline, worst states, check-in responses, cumulative radiation dose and per-indicator statistics.

## How it maps to NASA's five hazards
| Hazard | Indicators in ORBIT | Example action |
|---|---|---|
| Space radiation | Radiation rate, cumulative dose | Move to shielded area |
| Isolation and confinement | Mood, sleep, check-ins | Contact crew or ground, adjust schedule |
| Distance from Earth | Link status (LOS), local queue | Continue local monitoring, sync later |
| Gravity fields | Heart rate, blood pressure, skeletal view | Exercise protocol |
| Hostile closed environment | Cabin CO₂, temperature, SpO₂ | Check ventilation |

## Architecture
Telemetry (sensors or simulator) → FastAPI ingestion with validation and idempotent event IDs → trend and baseline analysis (NumPy / Pandas) → deterministic risk engine → SQLite event store → WebSocket gateway → Next.js dashboard. The optional Ollama assistant reads already-computed results and only explains them.

## Tech stack
Python, FastAPI, NumPy, Pandas, SQLite, WebSocket, Ollama (optional), Next.js 15, React, Recharts, Framer Motion, Tailwind CSS, Docker, pytest.

## Safety and honesty
- All demo data is **synthetic**.
- Thresholds are demonstration values. They must be reviewed by medical and spaceflight experts before any real use. ORBIT is decision support, not a diagnostic device.
- Core alerts work without AI and without internet.

## Quick start
docker compose up (verify these commands match your docker-compose.yml). Then open the frontend, choose a crew member and switch the simulator between normal, warning and critical modes to see the dashboard, anatomy view and check-in flow react.

## Demo scenario
A simulated 30-day mission runs in accelerated time: a radiation storm raises the dose, sleep debt builds, glucose fluctuates, an alert appears, the crew member checks in, the link drops and monitoring continues offline, then the post-mission report is generated.