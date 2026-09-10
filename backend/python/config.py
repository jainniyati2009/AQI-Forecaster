import os
from pathlib import Path

# Grid and Area Configuration
GRID_SIZE = 150  # 150x150 cells
GRID_RESOLUTION_KM = 1.0
VERTICAL_LEVELS = 20
DELHI_CENTER_LAT = 28.6139
DELHI_CENTER_LON = 77.2090

# Time Configuration
FORECAST_HOURS = 72
UPDATE_INTERVAL_SECONDS = 300  # 5 min

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PYTHON_DIR = Path(__file__).resolve().parent
DATA_DIR = PYTHON_DIR / "data"

MODEL_PATH = 'saved_models/aqi_adjuster_v1'
STATIONS_FILE = 'data/delhi_stations.json'
HOLIDAYS_FILE = 'data/holidays_india.json'
CROP_BURNING_FILE = 'data/crop_burning.json'

# AQI Configuration
AQI_BREAKPOINTS = {
    "PM2.5": [(0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200), (91, 120, 201, 300), (121, 250, 301, 400), (251, 500, 401, 500)],
    "PM10": [(0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200), (251, 350, 201, 300), (351, 430, 301, 400), (431, 1000, 401, 500)],
    "NO2": [(0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200), (181, 280, 201, 300), (281, 400, 301, 400), (401, 1000, 401, 500)],
    "O3": [(0, 50, 0, 50), (51, 100, 51, 100), (101, 168, 101, 200), (169, 208, 201, 300), (209, 748, 301, 400), (749, 1000, 401, 500)]
}

AQI_CATEGORIES = [
    {
        "range": (0, 50),
        "label": "Good",
        "color": "Green",
        "hex": "#00E400",
        "mask": "Not required",
        "advisory": "Air quality is satisfactory, and air pollution poses little or no risk.",
        "emoji": "😊"
    },
    {
        "range": (51, 100),
        "label": "Satisfactory",
        "color": "Yellow",
        "hex": "#FFFF00",
        "mask": "Not required",
        "advisory": "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
        "emoji": "🙂"
    },
    {
        "range": (101, 200),
        "label": "Moderate",
        "color": "Orange",
        "hex": "#FF7E00",
        "mask": "Recommended for sensitive groups",
        "advisory": "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
        "emoji": "😐"
    },
    {
        "range": (201, 300),
        "label": "Poor",
        "color": "Red",
        "hex": "#FF0000",
        "mask": "N95 recommended",
        "advisory": "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.",
        "emoji": "😷"
    },
    {
        "range": (301, 400),
        "label": "Very Poor",
        "color": "Purple",
        "hex": "#8F3F97",
        "mask": "N95 strongly recommended",
        "advisory": "Health alert: The risk of health effects is increased for everyone.",
        "emoji": "🤢"
    },
    {
        "range": (401, 5000),
        "label": "Severe",
        "color": "Maroon",
        "hex": "#7E0023",
        "mask": "N95 mandatory",
        "advisory": "Health warning of emergency conditions: everyone is more likely to be affected.",
        "emoji": "☠️"
    }
]
