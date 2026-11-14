from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TelemetryInput(BaseModel):
    """Kiruvchi telemetriya. Chegaralar fiziologik/aqlga muvofiq; chegaradan tashqari qiymat 422 bilan rad etiladi."""
    crew_id: Optional[str] = Field(None, min_length=1, max_length=64, description="Ekipaj ID (standart: CREW-1)")
    mission_id: Optional[str] = Field(None, min_length=1, max_length=64, description="Missiya ID (standart: MISSION-1)")
    event_id: Optional[str] = Field(None, min_length=1, max_length=128,
                                    description="Takrorlanmaslik uchun ID. Bir xil ID ikkinchi marta kelsa 'duplicate' qaytadi.")
    heart_rate: float = Field(75.0, ge=20.0, le=250.0, description="bpm")
    blood_pressure_sys: float = Field(120.0, ge=40.0, le=250.0, description="mmHg")
    radiation_level: float = Field(0.1, ge=0.0, le=10.0, description="mSv/h (simulyatsiya)")
    co2_level: float = Field(0.04, ge=0.0, le=5.0, description="% (kabina havosi)")
    sleep_debt: float = Field(0.0, ge=0.0, le=24.0, description="soat")


class CheckinInput(BaseModel):
    status: Literal["OK", "NEED_HELP"]
    note: str = Field("", max_length=500)
