# Delhi NCR AQI Forecast System

**Organization:** Autonomous Environment Analysis Corp.
**Problem Statement ID:** DEL-AQI-2025

A high-performance forecasting system designed to predict Air Quality Index (AQI) values across Delhi NCR over a 72-hour horizon. The system couples a WRF-Chem atmospheric chemistry model bridge (C++) with a TensorFlow-based adjustment layer to correct for localized hyper-emissions, stubble burning, and thermal inversion events.

## Architecture Overview

```
+----------------+      +-------------------+      +-------------------+
| WRF-Chem Data  | ---> | C++ Python Bridge | ---> | Feature Engineer  |
| (NetCDF/GRIB)  |      | (pybind11)        |      | (Weather, Stub.)  |
+----------------+      +-------------------+      +-------------------+
                                                            |
                                                            v
+----------------+      +-------------------+      +-------------------+
| Frontend App   | <--- | FastAPI Backend   | <--- | TF Adjuster Model |
| (HTML/JS/Maps) |      | (Cache & Routes)  |      | (Deep Neural Net) |
+----------------+      +-------------------+      +-------------------+
```

## Prerequisites
* **Python**: 3.10 or higher
* **C++ Compiler**: C++17 compatible (GCC, Clang, or MSVC) - *Optional (has fallback)*
* **CMake**: 3.15+ - *Optional (has fallback)*

> **Note**: The backend is designed to run in a fully realistic fallback mode if the C++ modules or trained ML models are absent. This allows UI/UX development and API integration testing without a heavy computational environment.

## Quick Start

1. **Build and Setup**
   Run the build script at the root of the project to check dependencies, compile the C++ bridge (if CMake is available), and install Python requirements.
   ```bash
   python build.py
   ```

2. **Run the API Server**
   If you chose not to start it from the build script, you can run the FastAPI server directly:
   ```bash
   python backend/python/main.py
   ```

3. **Access the Application**
   * **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   * **Dashboard**: [http://localhost:8000/](http://localhost:8000/)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forecast` | Returns 72-hour forecast for all monitoring stations |
| GET | `/api/forecast/{station_id}` | Returns 72-hour forecast for a specific station |
| GET | `/api/current` | Returns current AQI snapshot at all stations |
| GET | `/api/inversion` | Returns current meteorological inversion layer status |
| GET | `/api/stubble` | Returns stubble burning intensity and contribution |
| GET | `/api/health/{aqi}` | Returns specific health advisory for given AQI value |
| GET | `/api/stations` | Returns metadata for all monitoring stations |
| GET | `/api/heatmap` | Returns downsampled grid-level AQI for map rendering |

## AQI Health Advisories

| AQI Range | Category | Color | Advisory & Precautions |
|-----------|----------|-------|------------------------|
| 0 - 50 | Good | Green | Safe. No mask required. |
| 51 - 100 | Satisfactory | Yellow | Acceptable. Sensitive individuals take care. |
| 101 - 200 | Moderate | Orange | Sensitive groups should wear masks outside. |
| 201 - 300 | Poor | Red | N95 mask recommended. Limit outdoor activity. |
| 301 - 400 | Very Poor | Purple | N95 strongly recommended. Serious health risks. |
| 401+ | Severe | Maroon | N95 mandatory. Emergency conditions. |

## Technology Stack
* **Web Framework**: FastAPI (Python)
* **Machine Learning**: TensorFlow 2, Scikit-Learn
* **Data Processing**: Pandas, NumPy
* **Native Integration**: PyBind11, CMake
* **Server**: Uvicorn

## License
MIT License
