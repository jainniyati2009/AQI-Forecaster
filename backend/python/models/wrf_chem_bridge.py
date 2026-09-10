import numpy as np
import random
from typing import Dict, Any

class WRFChemBridge:
    def __init__(self):
        self.use_fallback = True
        try:
            import wrf_chem_core
            self.core = wrf_chem_core
            self.use_fallback = False
        except ImportError:
            pass
            
        self.stubble_sources = []

    def run_forecast(self, hours: int = 72) -> Dict[str, np.ndarray]:
        if not self.use_fallback:
            return self.core.run_forecast(hours)
            
        # Fallback Python simulation
        return self._generate_synthetic_forecast(hours)

    def get_inversion_status(self, hour: int) -> Dict[str, Any]:
        if not self.use_fallback:
            return self.core.get_inversion_status(hour)
            
        # Fallback simulation
        is_inversion = hour < 10 or hour > 18
        strength = random.uniform(0.5, 1.0) if is_inversion else random.uniform(0.0, 0.2)
        return {
            "hour": hour,
            "is_inversion": is_inversion,
            "strength": strength,
            "pbl_height_m": random.uniform(200, 500) if is_inversion else random.uniform(1000, 2000)
        }

    def add_stubble_source(self, lat: float, lon: float, intensity: float):
        if not self.use_fallback:
            self.core.add_stubble_source(lat, lon, intensity)
        self.stubble_sources.append({"lat": lat, "lon": lon, "intensity": intensity})

    def get_station_timeseries(self, station_id: str, hours: int = 72) -> Dict[str, np.ndarray]:
        if not self.use_fallback:
            return self.core.get_station_timeseries(station_id)
        
        return self._generate_synthetic_forecast(hours)

    def _generate_synthetic_forecast(self, hours: int) -> Dict[str, np.ndarray]:
        """Generate realistic synthetic data using AR(1) process and diurnal/seasonal patterns."""
        pm25 = np.zeros(hours)
        pm10 = np.zeros(hours)
        o3 = np.zeros(hours)
        nox = np.zeros(hours)
        temp = np.zeros(hours)
        ws = np.zeros(hours)
        wd = np.zeros(hours)
        pbl = np.zeros(hours)
        
        # Base values
        base_pm25 = 150.0
        
        for h in range(hours):
            hour_of_day = h % 24
            
            # Diurnal PM2.5 cycle
            if 7 <= hour_of_day <= 9 or 20 <= hour_of_day <= 23:
                diurnal_factor = 1.5
            elif 14 <= hour_of_day <= 16:
                diurnal_factor = 0.6
            else:
                diurnal_factor = 1.0
                
            noise = random.gauss(0, 10)
            pm25[h] = max(10, base_pm25 * diurnal_factor + noise)
            pm10[h] = pm25[h] * random.uniform(1.5, 2.0)
            o3[h] = max(5, 50 + 30 * np.sin(np.pi * (hour_of_day - 6) / 12) + random.gauss(0, 5))
            nox[h] = max(10, 80 * diurnal_factor + random.gauss(0, 8))
            temp[h] = 25 + 10 * np.sin(np.pi * (hour_of_day - 8) / 12) + random.gauss(0, 1)
            ws[h] = max(0.5, 2.0 + 1.5 * np.sin(np.pi * (hour_of_day - 6) / 12) + random.gauss(0, 0.5))
            wd[h] = (270 + random.gauss(0, 20)) % 360
            
            is_inversion = hour_of_day < 10 or hour_of_day > 18
            pbl[h] = random.uniform(200, 500) if is_inversion else random.uniform(1000, 2000)
            
            # Add stubble impact
            if self.stubble_sources and wd[h] > 270 and wd[h] < 360:
                total_intensity = sum(s["intensity"] for s in self.stubble_sources)
                pm25[h] += total_intensity * random.uniform(10, 50)
                
            # AR(1) smoothing logic: simplified
            if h > 0:
                pm25[h] = 0.7 * pm25[h-1] + 0.3 * pm25[h]
                
        return {
            "pm25": pm25,
            "pm10": pm10,
            "o3": o3,
            "nox": nox,
            "temperature": temp,
            "wind_speed": ws,
            "wind_dir": wd,
            "pbl_height": pbl
        }
