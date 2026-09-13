#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <random>
#include <algorithm>

#include "httplib.h"
#include "nlohmann/json.hpp"
#include <onnxruntime_cxx_api.h>

using json = nlohmann::json;

// --- Helper Functions ---

// Map AQI to Safety Categories strictly matching the requirement
json getSafetyInfo(int aqi) {
    if (aqi <= 50) return {{"color", "Green"}, {"mask", "No mask needed"}, {"category", "Good"}, {"desc", "Ideal air quality. Enjoy outdoor activities."}};
    if (aqi <= 100) return {{"color", "Yellow"}, {"mask", "No mask needed"}, {"category", "Moderate"}, {"desc", "Acceptable. Unusually sensitive people should limit heavy outdoor exertion."}};
    if (aqi <= 150) return {{"color", "Orange"}, {"mask", "N95 for sensitive groups"}, {"category", "Unhealthy for Sensitive Groups"}, {"desc", "Sensitive groups (asthma, elderly, children) limit time outside."}};
    if (aqi <= 200) return {{"color", "Red"}, {"mask", "N95 or KN95 for all"}, {"category", "Unhealthy"}, {"desc", "Everyone wear well-fitted N95. Avoid heavy exertion."}};
    if (aqi <= 300) return {{"color", "Purple"}, {"mask", "N95 or P100 required"}, {"category", "Very Unhealthy"}, {"desc", "Health alert. Everyone should wear an N95. Stay indoors."}};
    return {{"color", "Maroon"}, {"mask", "P100 or N95 strictly"}, {"category", "Hazardous"}, {"desc", "Emergency conditions. Stop all outdoor activities."}};
}

// Check if a date is a major holiday (Diwali rough window or Republic Day)
int isHoliday(int month, int day) {
    if (month == 11 && day >= 10 && day <= 15) return 1;
    if (month == 1 && day == 26) return 1;
    return 0;
}

int main() {
    // 1. Initialize ONNX Runtime
    Ort::Env env(ORT_LOGGING_LEVEL_WARNING, "AirAware");
    Ort::SessionOptions session_options;
    session_options.SetIntraOpNumThreads(1);
    
    // Note: The model is copied to the same directory as the executable by CMake
    #ifdef _WIN32
    const wchar_t* model_path = L"model.onnx";
    #else
    const char* model_path = "model.onnx";
    #endif
    
    std::cout << "Loading ONNX Model from: model.onnx" << std::endl;
    Ort::Session session(env, model_path, session_options);
    
    Ort::AllocatorWithDefaultOptions allocator;
    const char* input_names[] = {"keras_tensor"};
    const char* output_names[] = {"output_0"};

    // 2. Setup HTTP Server
    httplib::Server svr;

    svr.Get("/api/forecast", [&](const httplib::Request&, httplib::Response& res) {
        json response_json = json::array();
        
        auto now = std::chrono::system_clock::now();
        time_t now_c = std::chrono::system_clock::to_time_t(now);
        struct tm* parts = std::localtime(&now_c);
        
        for (int i = 0; i < 7; i++) {
            auto current_day = now + std::chrono::hours(24 * i);
            time_t current_c = std::chrono::system_clock::to_time_t(current_day);
            struct tm* current_parts = std::localtime(&current_c);
            
            int month = current_parts->tm_mon + 1; // 1-12
            int day = current_parts->tm_mday;
            int day_of_week = current_parts->tm_wday; // 0=Sunday in tm, but Python script used 0=Monday. 
            
            // Convert to Python format (0=Monday, 6=Sunday)
            int py_day_of_week = (day_of_week == 0) ? 6 : (day_of_week - 1);
            
            float norm_month = (month - 1.0f) / 11.0f;
            float norm_dow = py_day_of_week / 6.0f;
            float is_hol = (float)isHoliday(month, day);
            
            // Prepare Input Tensor
            std::vector<float> input_tensor_values = {norm_month, norm_dow, is_hol};
            std::vector<int64_t> input_node_dims = {1, 3};
            
            auto memory_info = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
            auto input_tensor = Ort::Value::CreateTensor<float>(
                memory_info, input_tensor_values.data(), input_tensor_values.size(),
                input_node_dims.data(), input_node_dims.size());
                
            // Run Inference
            auto output_tensors = session.Run(Ort::RunOptions{nullptr}, 
                input_names, &input_tensor, 1, output_names, 1);
                
            float* floatarr = output_tensors.front().GetTensorMutableData<float>();
            int predicted_aqi = std::max(10, (int)floatarr[0]);
            
            // Create Daily Data
            char date_str[64];
            char full_date_str[64];
            strftime(date_str, sizeof(date_str), "%a, %d %b", current_parts);
            strftime(full_date_str, sizeof(full_date_str), "%A, %d %B", current_parts); // e.g. Tuesday, 8 September
            
            // Mock hourly temperatures for the UI (around 24-34C)
            std::vector<int> hourly_temps = {24, 26, 29, 32, 31, 29, 27, 25, 24};
            
            json day_data = {
                {"date", (i == 0) ? "Today" : std::string(date_str)},
                {"full_date_string", std::string(full_date_str)},
                {"aqi", predicted_aqi},
                {"safety", getSafetyInfo(predicted_aqi)},
                {"pm25", (int)(predicted_aqi * 0.55)},
                {"pm10", (int)(predicted_aqi * 0.85)},
                {"o3", 40 + (rand() % 30)},
                {"no2", 20 + (rand() % 20)},
                {"so2", 10 + (rand() % 10)},
                {"min_aqi", std::max(10, predicted_aqi - 25)},
                {"max_aqi", predicted_aqi + 35},
                {"hourly_temps", hourly_temps}
            };
            response_json.push_back(day_data);
        }
        
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_content(response_json.dump(), "application/json");
    });

    std::cout << "Starting AirAware Server on http://localhost:8080" << std::endl;
    svr.listen("0.0.0.0", 8080);
    return 0;
}
