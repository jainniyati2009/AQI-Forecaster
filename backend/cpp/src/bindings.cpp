#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/numpy.h>
#include "coupling.h"
#include "inversion.h"

namespace py = pybind11;
using namespace wrf_chem;

py::dict run_forecast(py::dict initial_conditions, int hours = 72) {
    CoupledSimulator sim(60.0);
    sim.initialize();
    
    // In a real app, parse initial_conditions_dict here...
    
    {
        py::gil_scoped_release release;
        sim.run_forecast(hours);
    }
    
    py::dict result;
    result["status"] = "success";
    result["hours_simulated"] = hours;
    // Real implementation would return arrays
    return result;
}

py::dict get_inversion_profile(int hour) {
    // Mock
    py::dict res;
    res["inversion_present"] = true;
    res["base_height"] = 200.0;
    res["top_height"] = 500.0;
    return res;
}

void inject_stubble_plume(double lat, double lon, double intensity) {
    // Global state could be used, or passed to simulator instance
}

py::dict get_station_values(double lat, double lon) {
    py::dict res;
    // Mock
    std::vector<double> pm25(72, 100.0);
    res["pm25"] = py::array_t<double>(pm25.size(), pm25.data());
    return res;
}

py::array_t<double> get_grid_snapshot(int hour) {
    return py::array_t<double>();
}

PYBIND11_MODULE(wrf_chem_core, m) {
    m.doc() = "C++ WRF-Chem Simulator Core for Delhi NCR AQI Forecast System";
    
    m.def("run_forecast", &run_forecast, "Run full forecast", py::arg("initial_conditions"), py::arg("hours") = 72);
    m.def("get_inversion_profile", &get_inversion_profile);
    m.def("inject_stubble_plume", &inject_stubble_plume);
    m.def("get_station_values", &get_station_values);
    m.def("get_grid_snapshot", &get_grid_snapshot);
}
