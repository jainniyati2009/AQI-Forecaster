# AirAware – Air Pollution–Weather Coupled Forecasting System

This repository contains the complete implementation, machine learning models, and submission deliverables for **Smart India Hackathon (SIH) 2026**.

- **Repository Link:** [https://github.com/jainniyati2009/AQI-Forecaster](https://github.com/jainniyati2009/AQI-Forecaster)

---

## 1. Project Information

- **Project Title:** AirAware – Air Pollution–Weather Coupled Forecasting System (Delhi NCR Focus)
- **PS ID:** 26082
- **PS Title:** Air Pollution–Weather Coupled Forecasting System (Delhi NCR Focus)
- **Category:** Software
- **Theme:** Clean & Green Technology
- **Team Name:** Hacksmiths

---

## 2. Problem Statement

The National Capital Region (Delhi NCR) experiences catastrophic air quality degradation, especially during post-monsoon and winter months. The crisis is driven by compounding factors: seasonal agricultural stubble burning (parali) in upwind states, intense vehicular emissions, and industrial output. 

These emissions are trapped near the surface by unfavorable micro-meteorological phenomena, specifically **atmospheric thermal inversions** and low planetary boundary layer (PBL) heights. Existing monitoring frameworks predominantly offer retrospective, lagging readings from static physical stations. Without predictive foresight, citizens cannot take proactive health measures, and municipal authorities struggle to deploy targeted interventions before severe smog crises unfold.

---

## 3. Proposed Solution

**AirAware** is an AI-coupled atmospheric forecasting platform engineered for the Delhi NCR airshed. It bridges physical meteorological dynamics with machine learning to deliver high-precision, **72-hour hourly forecasts** of the Air Quality Index (AQI) and specific pollutants (PM2.5, PM10, NO2, O3).

The solution integrates:
1. **Coupled Atmospheric Modeling:** Adapts WRF-Chem (Weather Research and Forecasting coupled with Chemistry) dispersion principles to simulate transport and trapping of pollutants.
2. **AI Human-Factor & Pattern Adjuster:** Employs a trained neural network (exported via ONNX for sub-millisecond inference) to account for diurnal traffic rhythms, weekend fluctuations, and festive/holiday anomalies.
3. **Thermal Inversion Tracking:** Real-time diagnostics calculating inversion base/top heights, temperature lapse rates, and trapping efficiencies.
4. **Stubble Burning Influx Modeling:** Tracks seasonal crop fire intensity and northwestern wind trajectories carrying smoke plumes into Delhi.
5. **Interactive Glassmorphism Dashboard:** A responsive, mobile-first frontend with Leaflet.js geospatial mapping, animated hourly heatmaps, and CPCB-aligned health advisories.

---

## 4. Key Features

- **72-Hour Hourly AQI Forecast:** Granular hourly predictions for AQI and sub-pollutants (PM2.5, PM10, NO2, O3) across Delhi NCR monitoring stations (e.g., Anand Vihar, RK Puram, Punjabi Bagh, ITO).
- **Atmospheric Thermal Inversion Diagnostics:** Real-time detection of inversion layers, monitoring base/top height and pollutant trapping efficiency.
- **Stubble Burning (Parali) Impact Estimation:** Northwest plume direction tracking and PM2.5 load contribution estimation.
- **Dynamic Geospatial Heatmap & Map:** Leaflet.js-powered interactive map with live station pins, color-coded AQI severity badges, and 72-hour time-slider heatmaps.
- **Automated Health & Mask Advisories:** Actionable, certified health guidance and mask recommendations (None / N95 / KN95 / P100) mapped to Central Pollution Control Board (CPCB) NAQI categories.
- **Ultra-Fast Hybrid Inference Engine:** High-performance FastAPI backend with an extensible C++ simulation core and ONNX Runtime inference.
- **Modern Responsive Glassmorphism UI:** Mobile-first design with dark/light themes, smooth transitions, and intuitive station search.

---

## 5. Technology Stack

- **Frontend:** HTML5, CSS3 (Custom Glassmorphism, CSS Variables), JavaScript (Vanilla ES6+), Leaflet.js (GIS Map), FontAwesome 6
- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic, C++ (C++17, CMake)
- **Machine Learning & Modeling:** TensorFlow 2.x, ONNX / ONNX Runtime, NumPy, Pandas, Scikit-learn
- **Standards & Datasets:** Central Pollution Control Board (CPCB) National Air Quality Index (NAQI) Breakpoints, DPCC Station Coordinates, WRF-Chem atmospheric parameters
- **Deployment & Tooling:** Git, GitHub, RESTful JSON APIs

---

## 6. Architecture

```text
User / Browser
      |
      v
+-----------------------------------------------------------------+
|          Frontend Dashboard (HTML5, CSS3, JS, Leaflet.js)       |
+--------------------------------+--------------------------------+
                                 |  HTTP REST API
                                 v
+-----------------------------------------------------------------+
|                      FastAPI Backend Server                     |
|           (CORS, Static Serving, In-Memory Forecast Cache)      |
+--------------------------------+--------------------------------+
                                 |
         +-----------------------+-----------------------+
         |                                               |
         v                                               v
+---------------------------------+             +---------------------------------+
|       C++ Physics Core          |             |       AI / ML Predictor         |
|  - WRF-Chem coupled dynamics    |             |  - TensorFlow / ONNX Runtime    |
|  - Boundary layer physics       |             |  - Diurnal & holiday adjustment |
|  - Inversion layer diagnostics  |             |  - Multi-pollutant regression   |
+----------------+----------------+             +----------------+----------------+
                 |                                               |
                 +-----------------------+-----------------------+
                                         |
                                         v
+-----------------------------------------------------------------+
|            Forecasting & Health Advisory Aggregator             |
|   - Indian National AQI calculation (PM2.5, PM10, NO2, O3)      |
|   - Mask & health precautions (Good -> Hazardous)               |
|   - 72-Hour hourly forecast & spatial grid heatmap generator    |
+-----------------------------------------------------------------+
```

---

## 7. Repository Structure

```text
AQI-Forecaster/
├── README.md                           # Project documentation & overview
├── backend/                            # API server and scientific modeling
│   ├── python/                         # FastAPI application & ML pipelines
│   │   ├── api/                        # REST endpoints & Pydantic schemas
│   │   │   ├── routes.py               # API route definitions
│   │   │   └── schemas.py              # Pydantic data schemas
│   │   ├── data/                       # GeoJSON & environmental dataset files
│   │   │   ├── crop_burning.json       # Stubble burning data
│   │   │   ├── delhi_stations.json     # Station coordinates & agencies
│   │   │   └── holidays_india.json     # Calendar & holiday events
│   │   ├── models/                     # Scientific wrappers & neural network adjusters
│   │   │   ├── aqi_calculator.py       # CPCB NAQI formula engine
│   │   │   ├── feature_engineer.py     # Atmospheric feature engineering
│   │   │   ├── tf_adjuster.py          # ML adjustment runner
│   │   │   └── wrf_chem_bridge.py      # WRF-Chem atmospheric coupling bridge
│   │   ├── training/                   # Model training, preprocessing & evaluation
│   │   ├── config.py                   # Grid configuration & AQI breakpoints
│   │   └── main.py                     # FastAPI application entry point
│   ├── cpp/                            # C++ physics & dispersion engine
│   ├── fallback_server.py              # Lightweight fallback Python HTTP server
│   ├── server.cpp                      # Standalone C++ HTTP server
│   ├── CMakeLists.txt                  # C++ build configuration
│   └── requirements.txt                # Backend Python dependencies
├── frontend/                           # Responsive web dashboard
│   ├── index.html                      # Single-page application UI
│   ├── app.js                          # Dashboard logic, map rendering & API calls
│   ├── style.css                       # Glassmorphism styling and dark/light themes
│   ├── css/                            # Component stylesheets
│   └── js/                             # Client-side helper scripts
├── model_training/                     # Model training & ONNX export
│   ├── model.onnx                      # Exported neural network model
│   ├── train.py                        # Training script for synthetic & historical data
│   ├── requirements.txt                # Model training dependencies
│   └── saved_model_dir/                # Exported TensorFlow SavedModel
└── .gitignore                          # Git ignore configuration
```

### What goes where?

| Item | Location |
|---|---|
| Source code | `backend/` and `frontend/` |
| Machine Learning & Training | `model_training/` and `backend/python/training/` |
| Physics & Dispersion Engine | `backend/cpp/` |
| UI & Visual Interface | `frontend/` |
| Final PPT / presentation | [Google Slides Presentation](https://docs.google.com/presentation/d/1jvbc9FWc1lR7nS4QxYiI-RMLGTLIp6D5/edit?usp=sharing&ouid=116731810000300859546&rtpof=true&sd=true) |
| Demo video | [Google Drive Demo Folder](https://drive.google.com/drive/folders/1qca0H55btyWyI0dL3pPthMngHiE-E6dX?usp=sharing) |
| Project overview | `README.md` |

---

## 8. Final Presentation

The official SIH 2026 idea presentation covers the problem background, scientific methodology, coupled modeling architecture, and prototype validation:

- **Presentation Link:** [AirAware SIH 2026 Idea Presentation (Google Slides)](https://docs.google.com/presentation/d/1jvbc9FWc1lR7nS4QxYiI-RMLGTLIp6D5/edit?usp=sharing&ouid=116731810000300859546&rtpof=true&sd=true)

---

## 9. Demo Video

A video demonstrating the application features, interactive 72-hour forecast, inversion diagnostics, and UI dashboard:

- **Demo Video Link:** [AirAware Demo Video (Google Drive)](https://drive.google.com/drive/folders/1qca0H55btyWyI0dL3pPthMngHiE-E6dX?usp=sharing)

---

## 10. Screenshots / Prototype Photos

The AirAware dashboard features a high-fidelity glassmorphism interface:

- **Live Splash & Coupling Pipeline Screen:** Displays WRF-Chem, TensorFlow, and NAQI diagnostic pipeline indicators.
- **Real-Time AQI & Inversion Status:** Displays current AQI, primary pollutant breakdown, inversion layer base/top height, and trapping severity.
- **72-Hour Hourly Trend Scrubber:** Interactive chart showing anticipated diurnal peaks and nocturnal inversion traps.
- **GIS Station Map & Heatmap Layer:** Interactive Leaflet map with colored station markers and regional pollution dispersion heatmaps.

To view the live UI, follow the instructions in Section 12 to run the dashboard locally.

---

## 11. Installation

### Prerequisites
- Python 3.10 or higher
- Git

### Clone Repository & Install Dependencies
```bash
git clone https://github.com/jainniyati2009/AQI-Forecaster.git
cd AQI-Forecaster
pip install -r backend/requirements.txt
```

*(Optional: For model retraining)*
```bash
pip install -r model_training/requirements.txt
```

---

## 12. Run

### Option 1: Run Full FastAPI Server (Recommended)
This starts the backend API and simultaneously serves the frontend dashboard:

```bash
uvicorn backend.python.main:app --reload --host 0.0.0.0 --port 8000
```
Open your browser and navigate to:
```text
http://localhost:8000
```
Interactive API documentation (Swagger UI) is available at:
```text
http://localhost:8000/docs
```

### Option 2: Run Lightweight Fallback Server
If running on systems without full ML libraries:

```bash
python backend/fallback_server.py
```
Open `frontend/index.html` directly in your browser.

---

## 13. Future Scope

1. **Satellite Remote Sensing Integration:** Ingest real-time thermal anomaly data from ISRO INSAT-3D and NASA MODIS/VIIRS for live crop fire hotspot detection.
2. **Hyperlocal IoT Micro-Forecasting:** Integrate street-level low-cost IoT sensor networks to downscale forecasts to 100m grid resolutions.
3. **Pre-emptive Alert System:** Automated push notifications and SMS broadcasts to sensitive demographics (asthma patients, schools, elderly care centers) ahead of forecasted hazardous episodes.
4. **Policy & Intervention Simulator:** "What-if" digital twin allowing municipal authorities to simulate the impact of odd-even vehicle restrictions, construction pauses, or anti-smog water spraying.
5. **Native Mobile App:** Build cross-platform iOS and Android apps using Flutter or React Native with GPS-based localized exposure warnings.

---
