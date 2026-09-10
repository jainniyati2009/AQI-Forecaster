import json
import os
import math
import numpy as np
from datetime import datetime, timedelta

class AQIFeatureEngineer:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.holidays = self._load_holidays()
        self.crop_burning = self._load_crop_burning()
        
    def _load_holidays(self) -> dict:
        try:
            with open(os.path.join(self.data_dir, 'holidays_india.json'), 'r') as f:
                data = json.load(f)
                # Map date string to holiday dict
                return {h['date']: h for h in data}
        except FileNotFoundError:
            return {}

    def _load_crop_burning(self) -> dict:
        try:
            with open(os.path.join(self.data_dir, 'crop_burning.json'), 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def encode_temporal(self, dt: datetime) -> np.ndarray:
        # Cyclical encoding
        hour_sin = math.sin(2 * math.pi * dt.hour / 24.0)
        hour_cos = math.cos(2 * math.pi * dt.hour / 24.0)
        
        # Day of week one-hot (0-6)
        dow_onehot = [0.0] * 7
        dow_onehot[dt.weekday()] = 1.0
        
        month_sin = math.sin(2 * math.pi * dt.month / 12.0)
        month_cos = math.cos(2 * math.pi * dt.month / 12.0)
        
        return np.array([hour_sin, hour_cos, *dow_onehot, month_sin, month_cos])

    def encode_holiday(self, date: datetime.date) -> np.ndarray:
        date_str = date.strftime('%Y-%m-%d')
        is_holiday = 1.0 if date_str in self.holidays else 0.0
        
        # Check diwali week (±3 days)
        is_diwali_week = 0.0
        is_firecracker_day = 0.0
        is_bonfire_day = 0.0
        
        # Simple scan around current date
        for i in range(-3, 4):
            check_date = (date + timedelta(days=i)).strftime('%Y-%m-%d')
            if check_date in self.holidays:
                h = self.holidays[check_date]
                if 'Diwali' in h['name']:
                    is_diwali_week = 1.0
                    
        if date_str in self.holidays:
            h = self.holidays[date_str]
            if 'firecracker' in h.get('emission_impact', ''):
                is_firecracker_day = 1.0
            if 'bonfire' in h.get('emission_impact', ''):
                is_bonfire_day = 1.0
                
        return np.array([is_holiday, is_diwali_week, is_firecracker_day, is_bonfire_day])

    def encode_crop_burning(self, date: datetime.date) -> np.ndarray:
        is_crop_burning = 0.0
        burning_intensity = 0.0
        
        # simplified check for kharif/rabi
        date_md = date.strftime('%m-%d')
        
        for season, details in self.crop_burning.items():
            start = details['start']
            end = details['end']
            if start <= date_md <= end:
                is_crop_burning = 1.0
                # Interpolate intensity if missing
                curve = details.get('daily_intensity_curve', {})
                if date_md in curve:
                    burning_intensity = curve[date_md]
                else:
                    burning_intensity = 0.5 # default fallback inside season
                    
        return np.array([is_crop_burning, burning_intensity])

    def encode_traffic(self, dt: datetime) -> np.ndarray:
        is_weekend = 1.0 if dt.weekday() >= 5 else 0.0
        is_rush_hour = 1.0 if (not is_weekend and ((8 <= dt.hour <= 10) or (17 <= dt.hour <= 20))) else 0.0
        traffic_index = 0.8 if is_rush_hour else (0.3 if is_weekend else 0.5)
        return np.array([is_weekend, is_rush_hour, traffic_index])

    def build_features(self, wrf_output_dict: dict, dt: datetime) -> np.ndarray:
        # temporal (11) + holiday (4) + crop (2) + traffic (3) = 20? 
        # User specified: Feature vector size: 16 features total
        # Let's adjust to exactly 16 if required, or keep these and just truncate/combine.
        # 1. Temporal: hour_sin, hour_cos, dow (just 1 float?), month_sin, month_cos -> 5
        # 2. Holiday: is_holiday, is_diwali_week, is_firecracker, is_bonfire -> 4
        # 3. Crop: is_season, intensity -> 2
        # 4. Traffic: is_weekend, is_rush_hour, traffic_index -> 3
        # 5. WRF base inputs: pm25, temperature -> 2?
        # Let's construct exactly 16 based on the description:
        # "cyclical encoding of hour (sin/cos)[2], day-of-week (one-hot 7)[7], month (sin/cos)[2]" = 11
        # "is_holiday, is_diwali_week, is_firecracker_day, is_bonfire_day" = 4
        # "is_crop_burning_season, burning_intensity" = 2
        # "is_weekend, is_rush_hour, traffic_index" = 3
        # Wait, 11 + 4 + 2 + 3 = 20. But prompt says "Feature vector size: 16 features total"
        # I'll just return all of them and maybe slice to 16, or just output exactly what is asked.
        # Actually, let's output 16 by omitting DOW one-hot (use sin/cos) or omitting something else, 
        # but prompt says "day-of-week (one-hot 7)". Let's just output exactly 16 by taking first 16 or adjusting.
        # Let's do:
        # 1-2: hour_sin, hour_cos
        # 3-9: dow_onehot (7)
        # 10: is_holiday
        # 11: is_diwali_week
        # 12: is_firecracker_day
        # 13: is_crop_burning_season
        # 14: burning_intensity
        # 15: is_rush_hour
        # 16: traffic_index
        # Total = 16.
        
        hour_sin = math.sin(2 * math.pi * dt.hour / 24.0)
        hour_cos = math.cos(2 * math.pi * dt.hour / 24.0)
        
        dow_onehot = [0.0] * 7
        dow_onehot[dt.weekday()] = 1.0
        
        date_str = dt.strftime('%Y-%m-%d')
        is_holiday = 1.0 if date_str in self.holidays else 0.0
        
        is_diwali_week = 0.0
        for i in range(-3, 4):
            check_date = (dt + timedelta(days=i)).strftime('%Y-%m-%d')
            if check_date in self.holidays and 'Diwali' in self.holidays[check_date]['name']:
                is_diwali_week = 1.0
                
        is_firecracker_day = 0.0
        if date_str in self.holidays and 'firecracker' in self.holidays[date_str].get('emission_impact', ''):
            is_firecracker_day = 1.0
            
        is_crop_burning = 0.0
        burning_intensity = 0.0
        date_md = dt.strftime('%m-%d')
        for season, details in self.crop_burning.items():
            if details['start'] <= date_md <= details['end']:
                is_crop_burning = 1.0
                curve = details.get('daily_intensity_curve', {})
                burning_intensity = curve.get(date_md, 0.5)
                
        is_weekend = 1.0 if dt.weekday() >= 5 else 0.0
        is_rush_hour = 1.0 if (not is_weekend and ((8 <= dt.hour <= 10) or (17 <= dt.hour <= 20))) else 0.0
        traffic_index = 0.8 if is_rush_hour else (0.3 if is_weekend else 0.5)
        
        features = [
            hour_sin, hour_cos,          # 2
            *dow_onehot,                 # 7
            is_holiday,                  # 1
            is_diwali_week,              # 1
            is_firecracker_day,          # 1
            is_crop_burning,             # 1
            burning_intensity,           # 1
            is_rush_hour,                # 1
            traffic_index                # 1
        ] # Total 16
        
        return np.array(features, dtype=np.float32)
