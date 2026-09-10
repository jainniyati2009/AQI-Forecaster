#include "grid.h"
#include <stdexcept>

namespace wrf_chem {

WRFGrid::WRFGrid() : cells(NX * NY * NZ) {
    level_heights.resize(NZ);
    // Exponential stretching for vertical levels
    double h = 10.0; // Surface layer thickness
    for (int z = 0; z < NZ; ++z) {
        level_heights[z] = h;
        h *= 1.3; // Increase thickness with height
    }
}

void WRFGrid::initialize() {
    for (int z = 0; z < NZ; ++z) {
        for (int y = 0; y < NY; ++y) {
            for (int x = 0; x < NX; ++x) {
                GridCell& cell = get(x, y, z);
                // Standard atmosphere approximation
                cell.temperature = 300.0 - 0.0065 * get_level_height(z); 
                cell.pressure = 101325.0 * std::pow(1.0 - 2.25577e-5 * get_level_height(z), 5.25588);
                cell.humidity = 0.01;
                cell.wind_u = 2.0; // gentle westerly
                cell.wind_v = 1.0; // slight southerly
                cell.pbl_height = 1000.0;
                cell.pm25 = 50.0;
                cell.pm10 = 100.0;
                cell.o3 = 30.0;
                cell.nox = 20.0;
            }
        }
    }
}

GridCell& WRFGrid::get(int x, int y, int z) {
    if (x < 0 || x >= NX || y < 0 || y >= NY || z < 0 || z >= NZ) {
        throw std::out_of_range("Grid coordinates out of bounds");
    }
    return cells[z * NX * NY + y * NX + x];
}

const GridCell& WRFGrid::get(int x, int y, int z) const {
    if (x < 0 || x >= NX || y < 0 || y >= NY || z < 0 || z >= NZ) {
        throw std::out_of_range("Grid coordinates out of bounds");
    }
    return cells[z * NX * NY + y * NX + x];
}

std::tuple<int, int> WRFGrid::latlon_to_grid(double lat, double lon) const {
    // Very simplified flat-earth projection for a small domain
    double dlat = lat - LAT_CENTER;
    double dlon = lon - LON_CENTER;
    
    // 1 degree lat is approx 111km
    double dy = dlat * 111000.0;
    // 1 degree lon is approx 111km * cos(lat)
    double dx = dlon * 111000.0 * std::cos(LAT_CENTER * M_PI / 180.0);
    
    int x = NX / 2 + static_cast<int>(dx / DX);
    int y = NY / 2 + static_cast<int>(dy / DY);
    
    return {std::max(0, std::min(NX - 1, x)), std::max(0, std::min(NY - 1, y))};
}

std::tuple<double, double> WRFGrid::grid_to_latlon(int x, int y) const {
    double dx = (x - NX / 2) * DX;
    double dy = (y - NY / 2) * DY;
    
    double dlat = dy / 111000.0;
    double dlon = dx / (111000.0 * std::cos(LAT_CENTER * M_PI / 180.0));
    
    return {LAT_CENTER + dlat, LON_CENTER + dlon};
}

double WRFGrid::get_level_height(int z) const {
    return level_heights[z];
}

} // namespace wrf_chem
