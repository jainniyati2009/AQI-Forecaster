import numpy as np
import pandas as pd
import tensorflow as tf
import tf2onnx
from datetime import datetime, timedelta

# 1. Generate Synthetic Delhi AQI Data (Past 3 Years)
np.random.seed(42)
tf.random.set_seed(42)

start_date = datetime.today() - timedelta(days=3*365)
dates = [start_date + timedelta(days=i) for i in range(3*365)]

data = []
for d in dates:
    month = d.month
    day_of_week = d.weekday() # 0=Monday, 6=Sunday
    
    # Base AQI for Delhi (High baseline)
    base_aqi = np.random.normal(120, 20)
    
    # Factor 1: Crop burning season (Oct-Nov)
    if month in [10, 11]:
        base_aqi += np.random.normal(150, 30)
        
    # Factor 2: Winter inversions (Dec-Jan)
    if month in [12, 1]:
        base_aqi += np.random.normal(100, 20)
        
    # Factor 3: Summer/Monsoon (Jul-Aug) - rain clears the air
    if month in [7, 8]:
        base_aqi -= np.random.normal(50, 10)
        
    # Factor 4: Traffic (Lower on Sundays)
    if day_of_week == 6:
        base_aqi -= np.random.normal(20, 5)
        
    # Factor 5: Major Holidays (Approximate Diwali in Nov, Republic Day Jan 26)
    is_holiday = 0
    if month == 11 and 10 <= d.day <= 15: # Rough Diwali window
        is_holiday = 1
        base_aqi += np.random.normal(200, 40)
    elif month == 1 and d.day == 26: # Republic Day
        is_holiday = 1
        base_aqi += np.random.normal(50, 10)
        
    # Clip AQI to realistic ranges (0 to 500+)
    aqi = max(10, min(500, int(base_aqi)))
    
    data.append([month, day_of_week, is_holiday, aqi])

df = pd.DataFrame(data, columns=['Month', 'DayOfWeek', 'IsHoliday', 'AQI'])

X = df[['Month', 'DayOfWeek', 'IsHoliday']].values.astype(np.float32)
y = df['AQI'].values.astype(np.float32)

# Normalize inputs for better NN training
# Month: 1-12 -> 0-1
X[:, 0] = (X[:, 0] - 1.0) / 11.0
# DayOfWeek: 0-6 -> 0-1
X[:, 1] = X[:, 1] / 6.0
# IsHoliday is already 0 or 1

# 2. Train TensorFlow Model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(16, activation='relu', input_shape=(3,), name='input_features'),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dense(1, activation='linear', name='aqi_output')
])

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.01), loss='mse', metrics=['mae'])
print("Training ML Model...")
model.fit(X, y, epochs=50, batch_size=32, verbose=1)

# 3. Export to ONNX via SavedModel (Fixes Keras 3 / tf2onnx compatibility)
print("Exporting to ONNX format...")
model.export("saved_model_dir")

import subprocess
subprocess.run([
    "python", "-m", "tf2onnx.convert", 
    "--saved-model", "saved_model_dir", 
    "--output", "model.onnx", 
    "--opset", "13"
], check=True)

print("Successfully generated and exported model.onnx")
