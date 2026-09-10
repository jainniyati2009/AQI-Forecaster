import numpy as np
import pandas as pd
import pickle
from datetime import datetime, timedelta

def generate_synthetic_delhi_data(years: int = 5) -> pd.DataFrame:
    """Generates synthetic hourly data for Delhi mimicking 2019-2024."""
    start_date = datetime(2019, 1, 1)
    end_date = datetime(2019 + years, 12, 31, 23)
    
    date_rng = pd.date_range(start=start_date, end=end_date, freq='H')
    df = pd.DataFrame(date_rng, columns=['datetime'])
    
    # Seasonal PM2.5 baseline
    monthly_baselines = {
        1: 250, 2: 180, 3: 120, 4: 100, 5: 90, 6: 60,
        7: 40, 8: 35, 9: 50, 10: 150, 11: 350, 12: 300
    }
    
    df['month'] = df['datetime'].dt.month
    df['hour'] = df['datetime'].dt.hour
    df['base_pm25'] = df['month'].map(monthly_baselines)
    
    # Add Diwali spikes (Oct/Nov usually)
    # Simple approx: around Nov 1-3 each year
    df['is_diwali'] = ((df['month'] == 11) & (df['datetime'].dt.day <= 3)).astype(int)
    
    # Add crop burning boost (Oct 15 - Nov 15)
    df['is_crop_burning'] = (((df['month'] == 10) & (df['datetime'].dt.day >= 15)) | 
                              ((df['month'] == 11) & (df['datetime'].dt.day <= 15))).astype(int)
                              
    # Compute PM2.5
    pm25 = df['base_pm25'].values
    
    # Diurnal variation
    diurnal_mult = np.ones(len(df))
    diurnal_mult[(df['hour'] >= 7) & (df['hour'] <= 9)] = 1.3
    diurnal_mult[(df['hour'] >= 20) & (df['hour'] <= 23)] = 1.4
    diurnal_mult[(df['hour'] >= 14) & (df['hour'] <= 16)] = 0.7
    
    pm25 = pm25 * diurnal_mult
    
    # Holiday traffic reduction (weekends)
    is_weekend = (df['datetime'].dt.dayofweek >= 5).astype(int).values
    pm25 = pm25 * (1.0 - 0.15 * is_weekend)
    
    # Add spikes
    pm25 += df['is_diwali'].values * np.random.uniform(500, 900, len(df))
    pm25 += df['is_crop_burning'].values * np.random.uniform(50, 200, len(df))
    
    # Add random noise
    pm25 += np.random.normal(0, 20, len(df))
    pm25 = np.maximum(pm25, 10) # Floor at 10
    
    df['pm25'] = pm25
    df['pm10'] = pm25 * 1.6 + np.random.normal(0, 10, len(df))
    df['temperature'] = 25 + 10 * np.sin(np.pi * (df['hour'] - 8) / 12) + np.random.normal(0, 2, len(df))
    
    # Simulated WRF output (raw)
    df['wrf_pm25'] = df['pm25'] * 0.8 + np.random.normal(0, 30, len(df)) # Underpredicts
    
    # Target adjustment factor
    df['target_adj_factor'] = df['pm25'] / df['wrf_pm25'].clip(lower=1.0)
    
    return df

def normalize_features(features: np.ndarray, fit: bool = True, scaler_path: str = None) -> np.ndarray:
    """MinMax normalization."""
    # Dummy implementation for simplicity. In real code use sklearn MinMaxScaler
    if fit:
        min_val = np.min(features, axis=0)
        max_val = np.max(features, axis=0)
        max_val[max_val == min_val] = min_val[max_val == min_val] + 1e-6 # Avoid div by zero
        scaler = {'min': min_val, 'max': max_val}
        if scaler_path:
            save_scaler(scaler, scaler_path)
    else:
        if scaler_path:
            scaler = load_scaler(scaler_path)
            min_val = scaler['min']
            max_val = scaler['max']
        else:
            return features # Can't normalize without scaler
            
    norm_features = (features - min_val) / (max_val - min_val)
    return norm_features

def create_sequences(data: np.ndarray, target: np.ndarray, seq_len: int = 72):
    """Creates windowed sequences for LSTM/Conv1D."""
    X, y = [], []
    for i in range(len(data) - seq_len):
        X.append(data[i:(i + seq_len)])
        y.append(target[i + seq_len - 1])
    return np.array(X), np.array(y)

def save_scaler(scaler: dict, path: str):
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        pickle.dump(scaler, f)

def load_scaler(path: str) -> dict:
    with open(path, 'rb') as f:
        return pickle.load(f)
