from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


class TelemetryInput(BaseModel):
    """Kiruvchi telemetriya. Chegaralar fiziologik/aqlga muvofiq; chegaradan tashqari qiymat 422 bilan rad etiladi."""
    crew_id: Optional[str] = Field(None, min_length=1, max_length=64, description="Ekipaj ID (standart: CREW-1)")
    mission_id: Optional[str] = Field(None, min_length=1, max_length=64, description="Missiya ID (standart: MISSION-1)")
    event_id: Optional[str] = Field(None, min_length=1, max_length=128,
                                    description="Takrorlanmaslik uchun ID. Bir xil ID ikkinchi marta kelsa 'duplicate' qaytadi.")
    heart_rate: float = Field(75.0, ge=20.0, le=250.0, description="bpm (NASA HRP, normal: 60..100)")
    blood_pressure_sys: float = Field(120.0, ge=40.0, le=250.0, description="mmHg (AHA, normal: 90..130)")
    radiation_level: float = Field(0.1, ge=0.0, le=10.0, description="mSv/h (NASA SRPE ALARA limit)")
    co2_level: float = Field(0.04, ge=0.0, le=5.0, description="% (kabina havosi, NASA ISS ECLSS)")
    sleep_debt: float = Field(0.0, ge=0.0, le=24.0, description="soat (NASA BHP charchoq indeksi)")
    blood_glucose_mgdl: float = Field(95.0, ge=20.0, le=600.0, description="mg/dL (ADA / NASA Flight Med)")
    body_temp_c: float = Field(36.8, ge=30.0, le=43.0, description="°C (NASA STD-3001)")
    sleep_hours_last_night: float = Field(8.0, ge=0.0, le=16.0, description="soat (NASA BHP)")
    mood: Optional[int] = Field(None, ge=1, le=5, description="Kayfiyat shkalasi 1-5")
    # Backwards compatibility:
    blood_sugar: Optional[float] = Field(None, ge=20.0, le=600.0, description="Alias for blood_glucose_mgdl")
    body_temperature: Optional[float] = Field(None, ge=30.0, le=45.0, description="Alias for body_temp_c")

    @model_validator(mode="before")
    @classmethod
    def sync_legacy_fields(cls, values: dict):
        if isinstance(values, dict):
            if "blood_sugar" in values and "blood_glucose_mgdl" not in values:
                values["blood_glucose_mgdl"] = values["blood_sugar"]
            elif "blood_glucose_mgdl" in values and "blood_sugar" not in values:
                values["blood_sugar"] = values["blood_glucose_mgdl"]

            if "body_temperature" in values and "body_temp_c" not in values:
                values["body_temp_c"] = values["body_temperature"]
            elif "body_temp_c" in values and "body_temperature" not in values:
                values["body_temperature"] = values["body_temp_c"]
        return values


class CheckinInput(BaseModel):
    status: Literal["OK", "NEED_HELP"]
    note: str = Field("", max_length=500)
    mood: Optional[int] = Field(None, ge=1, le=5, description="Kayfiyat shkalasi: 1 (juda yomon) dan 5 (a'lo) gacha")
    symptoms: Optional[List[str]] = Field(default_factory=list, description="Simptomlar ro'yxati (masalan: bosh og'rig'i, ko'ngil aynishi)")
