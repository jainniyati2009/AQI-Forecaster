#pragma once

#include <vector>
#include <tuple>
#include <cmath>

namespace wrf_chem {

struct GridCell {
    double temperature; // K
    double pressure;    // Pa
    double humidity;    // kg/kg
    double wind_u;      // m/s
    double wind_v;      // m/s
    double pbl_height;  // m
    double pm25;        // ug/m3
    double pm10;        // ug/m3
    double o3;          // ppb
    double nox;         // ppb
};

class WRFGrid {
public:
    static constexpr int NX = 150;
    static constexpr int NY = 150;
    static constexpr int NZ = 20;

    static constexpr double LAT_CENTER = 28.6139;
    static constexpr double LON_CENTER = 77.2090;
    static constexpr double DX = 1000.0; // 1 km resolution
    static constexpr double DY = 1000.0; // 1 km resolution

    WRFGrid();

    void initialize();
    
    // Accessor
    GridCell& get(int x, int y, int z);
    const GridCell& get(int x, int y, int z) const;

    // Convert lat/lon to grid indices
    std::tuple<int, int> latlon_to_grid(double lat, double lon) const;
    std::tuple<double, double> grid_to_latlon(int x, int y) const;
    
    // Get height of level z (approximate)
    double get_level_height(int z) const;

private:
    std::vector<GridCell> cells;
    std::vector<double> level_heights;
};

} // namespace wrf_chem
