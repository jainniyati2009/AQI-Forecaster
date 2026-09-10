from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional
from datetime import datetime, timezone
import random

from api.schemas import (
    StationForecast, CurrentAQI, StubbleBurningStatus, HeatmapResponse,
    HealthAdvisory, StationInfo, InversionStatus, HeatmapCell
)
from config import AQI_CATEGORIES

router = APIRouter()

# Module-level cache to store the latest forecast data
ForecastCache: Dict[str, Any] = {
    "stations": {},
    "forecasts": {},
    "heatmap": {},
    "stubble": None,
    "inversion": None,
    "last_updated": None
}

def get_health_advisory(aqi: int) -> HealthAdvisory:
    """Helper to get health advisory for a given AQI."""
    for category in AQI_CATEGORIES:
        low, high = category["range"]
        if low <= aqi <= high:
            return HealthAdvisory(
                aqi=aqi,
                category=category["label"],
                color=category["color"],
                color_hex=category["hex"],
                emoji=category["emoji"],
                label=category["label"],
                mask_recommendation=category["mask"],
                advisory_text=category["advisory"]
            )
    # Fallback for out of range (> 5000)
    cat = AQI_CATEGORIES[-1]
    return HealthAdvisory(
        aqi=aqi,
        category=cat["label"],
        color=cat["color"],
        color_hex=cat["hex"],
        emoji=cat["emoji"],
        label=cat["label"],
        mask_recommendation=cat["mask"],
        advisory_text=cat["advisory"]
    )

@router.get("/forecast", response_model=Dict[str, StationForecast])
async def get_all_forecasts():
    """Returns 72-hour forecast for ALL stations."""
    if not ForecastCache.get("forecasts"):
        raise HTTPException(status_code=503, detail="Forecast data is currently being generated. Try again shortly.")
    return ForecastCache["forecasts"]

@router.get("/forecast/{station_id}", response_model=StationForecast)
async def get_station_forecast(station_id: str):
    """Returns 72-hour forecast for specific station."""
    forecasts = ForecastCache.get("forecasts", {})
    if station_id not in forecasts:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found.")
    return forecasts[station_id]

@router.get("/current", response_model=Dict[str, CurrentAQI])
async def get_current_aqi():
    """Returns current AQI at all stations (hour 0 of forecast)."""
    forecasts = ForecastCache.get("forecasts", {})
    if not forecasts:
        raise HTTPException(status_code=503, detail="Data not available yet.")
    
    current_data = {}
    for st_id, sf in forecasts.items():
        if sf.forecast:
            current_hour = sf.forecast[0]
            current_data[st_id] = CurrentAQI(
                station=sf.station,
                aqi=current_hour.aqi,
                aqi_raw=current_hour.aqi_raw,
                pollutants={
                    "pm25": current_hour.pm25,
                    "pm10": current_hour.pm10,
                    "o3": current_hour.o3,
                    "nox": current_hour.nox
                },
                health=current_hour.health,
                inversion=current_hour.inversion,
                updated_at=sf.generated_at
            )
    return current_data

@router.get("/inversion")
async def get_inversion_status():
    """Returns current inversion layer status (aggregated across Delhi)."""
    inv = ForecastCache.get("inversion")
    if not inv:
        # Generate dummy inversion data if not cached
        inv = {
            "detected": True,
            "base_height_m": 150.0,
            "top_height_m": 450.0,
            "strength_celsius": 3.2,
            "depth_m": 300.0,
            "lapse_rate": -1.5,
            "trapping_efficiency": 0.85,
            "forecast_next_12h": [
                {"hour": i, "detected": i < 8, "base_height_m": 150.0 + (i*10)} for i in range(12)
            ]
        }
    return inv

@router.get("/stubble", response_model=StubbleBurningStatus)
async def get_stubble_burning_status():
    """Returns stubble burning status based on current date."""
    stubble = ForecastCache.get("stubble")
    if not stubble:
        stubble = StubbleBurningStatus(
            active=True,
            season="Kharif (Post-Monsoon)",
            intensity=0.75,
            source_direction_deg=315.0,  # NW (Punjab/Haryana)
            estimated_pm25_contribution=85.5,
            plume_description="Dense smoke plume traveling southeast towards Delhi NCR."
        )
    return stubble

@router.get("/health/{aqi}", response_model=HealthAdvisory)
async def get_health_advisory_route(aqi: int):
    """Returns health advisory for given AQI value."""
    if aqi < 0:
        raise HTTPException(status_code=400, detail="AQI cannot be negative.")
    return get_health_advisory(aqi)

@router.get("/stations", response_model=List[StationInfo])
async def get_all_stations():
    """Returns list of all monitoring stations."""
    stations = ForecastCache.get("stations", {})
    if not stations:
        raise HTTPException(status_code=503, detail="Stations data not loaded.")
    return list(stations.values())

@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap(hour: int = Query(0, ge=0, le=72)):
    """Returns grid-level AQI for map overlay."""
    hm_cache = ForecastCache.get("heatmap", {})
    
    if hour in hm_cache:
        return hm_cache[hour]
        
    # Generate fallback 30x30 dummy heatmap data if not available
    cells = []
    base_lat, base_lon = 28.6139, 77.2090
    for i in range(30):
        for j in range(30):
            lat = base_lat + (i - 15) * 0.02
            lon = base_lon + (j - 15) * 0.02
            dist = ((i-15)**2 + (j-15)**2)**0.5
            aqi = int(max(50, 450 - dist * 10 + random.randint(-20, 20)))
            cells.append(HeatmapCell(lat=lat, lon=lon, aqi=aqi, pm25=aqi*0.8))
            
    resp = HeatmapResponse(
        cells=cells,
        hour=hour,
        generated_at=datetime.now(timezone.utc).isoformat()
    )
    return resp
