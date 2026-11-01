from pydantic import BaseModel


class TelemetryInput(BaseModel):
    heart_rate: float = 75.0
    blood_pressure_sys: float = 120.0
    radiation_level: float = 0.1
    co2_level: float = 0.04
    sleep_debt: float = 0.0