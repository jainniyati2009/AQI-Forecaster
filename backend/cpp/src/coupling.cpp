#include "coupling.h"
#include <iostream>

namespace wrf_chem {

CoupledSimulator::CoupledSimulator(double dt) 
    : dt(dt), meteo(dt), chem(dt) {}

void CoupledSimulator::initialize() {
    grid.initialize();
    hourly_snapshots.clear();
    hourly_snapshots.push_back(grid);
}

void CoupledSimulator::add_stubble_plume(const PlumeSource& src) {
    plumes.push_back(src);
}

void CoupledSimulator::step() {
    meteo.step(grid);
    chem.step(grid);
    
    // Periodically inject plumes (simplified)
    for (const auto& plume : plumes) {
        // Average domain wind
        double u = grid.get(WRFGrid::NX/2, WRFGrid::NY/2, 0).wind_u;
        double v = grid.get(WRFGrid::NX/2, WRFGrid::NY/2, 0).wind_v;
        double ws = std::sqrt(u*u + v*v);
        double wd = std::atan2(-u, -v) * 180.0 / M_PI;
        
        // Check inversion
        std::vector<double> t_prof(WRFGrid::NZ), h_prof(WRFGrid::NZ);
        for(int z=0; z<WRFGrid::NZ; ++z) {
            t_prof[z] = grid.get(WRFGrid::NX/2, WRFGrid::NY/2, z).temperature;
            h_prof[z] = grid.get_level_height(z);
        }
        auto inv = InversionDetector::detect_inversion(t_prof, h_prof, grid.get(WRFGrid::NX/2, WRFGrid::NY/2, 0).pbl_height);
        
        dispersion.add_stubble_burning_plume(grid, plume, ws, wd, 'D', inv.inversion_present ? inv.top_height : 5000.0);
    }
}

void CoupledSimulator::run_forecast(int hours) {
    int steps_per_hour = static_cast<int>(3600.0 / dt);
    for (int h = 0; h < hours; ++h) {
        for (int s = 0; s < steps_per_hour; ++s) {
            step();
        }
        hourly_snapshots.push_back(grid);
    }
}

std::vector<WRFGrid> CoupledSimulator::get_hourly_snapshots() const {
    return hourly_snapshots;
}

std::vector<GridCell> CoupledSimulator::get_station_values(double lat, double lon) const {
    std::vector<GridCell> series;
    auto [x, y] = grid.latlon_to_grid(lat, lon);
    for (const auto& snap : hourly_snapshots) {
        series.push_back(snap.get(x, y, 0));
    }
    return series;
}

} // namespace wrf_chem
