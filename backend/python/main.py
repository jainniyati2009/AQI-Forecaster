import asyncio
import json
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from config import UPDATE_INTERVAL_SECONDS, FORECAST_HOURS
from api.routes import router as api_router, ForecastCache, get_health_advisory
from api.schemas import StationInfo, StationForecast, HourlyForecast, InversionStatus

# Try importing real ML models, set flag to fallback if missing
try:
    from models.wrf_chem_bridge import run_wrf_chem
    from models.feature_engineer import engineer_features
    from models.tf_adjuster import adjust_forecast
    from models.aqi_calculator import calculate_aqi
    MODELS_AVAILABLE = True
except ImportError:
    MODELS_AVAILABLE = False
    print("Warning: ML/C++ Models not found. Operating in fallback mode with realistic generated data.")

def generate_mock_data():
    """Generates realistic fallback data when models are not available."""
    now = datetime.now(timezone.utc)
    
    # Generate mock stations
    mock_stations = {
        "S001": StationInfo(id="S001", name="Anand Vihar", lat=28.6476, lon=77.3158, agency="DPCC", type="Traffic"),
        "S002": StationInfo(id="S002", name="RK Puram", lat=28.5632, lon=77.1869, agency="DPCC", type="Residential"),
        "S003": StationInfo(id="S003", name="Punjabi Bagh", lat=28.6740, lon=77.1310, agency="DPCC", type="Residential"),
        "S004": StationInfo(id="S004", name="ITO", lat=28.6276, lon=77.2411, agency="CPCB", type="Traffic")
    }
    ForecastCache["stations"] = mock_stations
    
    # Generate 72 hour forecasts
    forecasts = {}
    for st_id, station in mock_stations.items():
        base_aqi = random.randint(250, 400) if station.type == "Traffic" else random.randint(150, 300)
        
        hourly_data = []
        for hour in range(FORECAST_HOURS):
            # Diurnal curve variation
            time_of_day = (now + timedelta(hours=hour)).hour
            diurnal_factor = 1.2 if (8 <= time_of_day <= 11 or 18 <= time_of_day <= 22) else 0.8
            
            current_aqi = int(base_aqi * diurnal_factor + random.randint(-15, 15))
            health = get_health_advisory(current_aqi)
            
            inversion = InversionStatus(
                detected=True if (22 <= time_of_day or time_of_day <= 7) else False,
                base_height_m=random.uniform(100, 300),
                top_height_m=random.uniform(400, 800),
                strength_celsius=random.uniform(1.0, 5.0),
                depth_m=random.uniform(200, 500),
                lapse_rate=-random.uniform(1.0, 3.0),
                trapping_efficiency=random.uniform(0.6, 0.9)
            )
            
            hf = HourlyForecast(
                timestamp=(now + timedelta(hours=hour)).isoformat(),
                hour=hour,
                aqi=current_aqi,
                aqi_raw=current_aqi - random.randint(5, 20),
                pm25=current_aqi * 0.8 + random.uniform(-5, 5),
                pm10=current_aqi * 1.2 + random.uniform(-10, 10),
                o3=random.uniform(20, 80),
                nox=random.uniform(40, 120),
                temperature_c=random.uniform(15.0, 35.0),
                wind_speed_ms=random.uniform(0.5, 5.0),
                wind_direction_deg=random.uniform(0, 360),
                pbl_height_m=random.uniform(200, 1500),
                inversion=inversion,
                health=health
            )
            hourly_data.append(hf)
            
        forecasts[st_id] = StationForecast(
            station=station,
            forecast=hourly_data,
            generated_at=now.isoformat()
        )
    
    ForecastCache["forecasts"] = forecasts
    ForecastCache["last_updated"] = now.isoformat()
    print(f"Mock data refreshed at {now.isoformat()}")

async def refresh_forecast():
    """Background task to periodically refresh the forecast."""
    while True:
        try:
            if MODELS_AVAILABLE:
                # Real ML pipeline would go here
                pass
            else:
                generate_mock_data()
        except Exception as e:
            print(f"Error generating forecast: {e}")
        
        await asyncio.sleep(UPDATE_INTERVAL_SECONDS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load stations, data, initialize models
    print("Initializing Delhi NCR AQI Forecast System...")
    
    # Run initial forecast generation
    if not MODELS_AVAILABLE:
        generate_mock_data()
        
    # Start background refresh task
    task = asyncio.create_task(refresh_forecast())
    
    yield
    
    # Shutdown
    print("Shutting down... Cleaning up background tasks.")
    task.cancel()

app = FastAPI(
    title="Delhi NCR AQI Forecast System",
    description="Real-time AQI forecasting backend using WRF-Chem and ML adjusters",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")

# Static files for frontend dashboard
frontend_dir = Path(__file__).parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
async def serve_index():
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Delhi AQI API is running. Frontend not found."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
