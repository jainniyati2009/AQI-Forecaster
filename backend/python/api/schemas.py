from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class StationInfo(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    agency: str
    type: str

class PollutantData(BaseModel):
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    o3: Optional[float] = None
    nox: Optional[float] = None

class InversionStatus(BaseModel):
    detected: bool
    base_height_m: float
    top_height_m: float
    strength_celsius: float
    depth_m: float
    lapse_rate: float
    trapping_efficiency: float

class HealthAdvisory(BaseModel):
    aqi: int
    category: str
    color: str
    color_hex: str
    emoji: str
    label: str
    mask_recommendation: str
    advisory_text: str

class HourlyForecast(BaseModel):
    timestamp: str
    hour: int
    aqi: int
    aqi_raw: int
    pm25: float
    pm10: float
    o3: float
    nox: float
    temperature_c: float
    wind_speed_ms: float
    wind_direction_deg: float
    pbl_height_m: float
    inversion: InversionStatus
    health: HealthAdvisory

class StationForecast(BaseModel):
    station: StationInfo
    forecast: List[HourlyForecast]
    generated_at: str

class CurrentAQI(BaseModel):
    station: StationInfo
    aqi: int
    aqi_raw: int
    pollutants: PollutantData
    health: HealthAdvisory
    inversion: InversionStatus
    updated_at: str

class StubbleBurningStatus(BaseModel):
    active: bool
    season: str
    intensity: float  # 0.0 to 1.0
    source_direction_deg: float
    estimated_pm25_contribution: float
    plume_description: str

class HeatmapCell(BaseModel):
    lat: float
    lon: float
    aqi: int
    pm25: float

class HeatmapResponse(BaseModel):
    cells: List[HeatmapCell]
    hour: int
    generated_at: str
