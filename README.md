# AirAware: AQI Forecasting Web Application

A complete, mobile-first web application for monitoring and predicting the Air Quality Index (AQI) in Delhi and the NCR region.

## Features
- **Live AI Predictions:** Uses a TensorFlow neural network (exported via ONNX) to forecast AQI based on seasonality, days of the week, and holiday traffic/crop-burning patterns.
- **Glassmorphism UI:** A polished, modern vanilla JS/HTML/CSS frontend matching high-fidelity mobile designs.
- **Interactive Map:** Leaflet.js integration for real-time location selection.
- **Hybrid Backend:** C++ / Python fallback API serving real-time model inference.

## Structure
- `/frontend`: Vanilla JS/HTML/CSS UI
- `/backend`: API Server (C++ & Python Fallback)
- `/model_training`: AI training and synthetic data generation scripts
