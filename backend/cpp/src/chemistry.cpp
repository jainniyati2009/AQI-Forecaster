#include "chemistry.h"

namespace wrf_chem {

ChemistryTransport::ChemistryTransport(double dt) : dt(dt) {}

void ChemistryTransport::add_source(const EmissionSource& source) {
    sources.push_back(source);
}

void ChemistryTransport::step(WRFGrid& grid) {
    add_emissions(grid);
    advect_species(grid);
    apply_chemistry(grid);
    apply_deposition(grid);
}

void ChemistryTransport::advect_species(WRFGrid& grid) {
    WRFGrid grid_next = grid; 
    for (int z = 0; z < WRFGrid::NZ; ++z) {
        for (int y = 1; y < WRFGrid::NY - 1; ++y) {
            for (int x = 1; x < WRFGrid::NX - 1; ++x) {
                const auto& c = grid.get(x, y, z);
                
                auto advect = [&](double val, double v_xm, double v_xp, double v_ym, double v_yp) {
                    double dc_dx = (c.wind_u > 0) ? (val - v_xm) / WRFGrid::DX : (v_xp - val) / WRFGrid::DX;
                    double dc_dy = (c.wind_v > 0) ? (val - v_ym) / WRFGrid::DY : (v_yp - val) / WRFGrid::DY;
                    return val - dt * (c.wind_u * dc_dx + c.wind_v * dc_dy);
                };

                grid_next.get(x, y, z).pm25 = advect(c.pm25, grid.get(x-1,y,z).pm25, grid.get(x+1,y,z).pm25, grid.get(x,y-1,z).pm25, grid.get(x,y+1,z).pm25);
                grid_next.get(x, y, z).pm10 = advect(c.pm10, grid.get(x-1,y,z).pm10, grid.get(x+1,y,z).pm10, grid.get(x,y-1,z).pm10, grid.get(x,y+1,z).pm10);
                grid_next.get(x, y, z).o3 = advect(c.o3, grid.get(x-1,y,z).o3, grid.get(x+1,y,z).o3, grid.get(x,y-1,z).o3, grid.get(x,y+1,z).o3);
                grid_next.get(x, y, z).nox = advect(c.nox, grid.get(x-1,y,z).nox, grid.get(x+1,y,z).nox, grid.get(x,y-1,z).nox, grid.get(x,y+1,z).nox);
            }
        }
    }
    grid = grid_next;
}

void ChemistryTransport::apply_chemistry(WRFGrid& grid) {
    // Simplified photochemistry (Chapman cycle approx)
    // NOx -> O3 during daylight (assumed active for simplicity here)
    double k1 = 0.01; // Rate constant for NOx -> O3
    
    for (int z = 0; z < WRFGrid::NZ; ++z) {
        for (int y = 0; y < WRFGrid::NY; ++y) {
            for (int x = 0; x < WRFGrid::NX; ++x) {
                auto& c = grid.get(x, y, z);
                double d_o3 = k1 * c.nox * dt;
                c.o3 += d_o3;
                c.nox -= d_o3;
                if (c.nox < 0) c.nox = 0;
            }
        }
    }
}

void ChemistryTransport::apply_deposition(WRFGrid& grid) {
    // Dry deposition at surface
    double v_d_pm25 = 0.001; // m/s
    double v_d_o3 = 0.005;   // m/s
    
    for (int y = 0; y < WRFGrid::NY; ++y) {
        for (int x = 0; x < WRFGrid::NX; ++x) {
            auto& c = grid.get(x, y, 0);
            double h = grid.get_level_height(0);
            
            c.pm25 -= (v_d_pm25 * c.pm25 / h) * dt;
            c.o3 -= (v_d_o3 * c.o3 / h) * dt;
            
            if (c.pm25 < 0) c.pm25 = 0;
            if (c.o3 < 0) c.o3 = 0;
        }
    }
}

void ChemistryTransport::add_emissions(WRFGrid& grid) {
    double cell_volume = WRFGrid::DX * WRFGrid::DY * grid.get_level_height(0);
    
    for (const auto& src : sources) {
        if (src.grid_x >= 0 && src.grid_x < WRFGrid::NX && src.grid_y >= 0 && src.grid_y < WRFGrid::NY) {
            auto& c = grid.get(src.grid_x, src.grid_y, 0);
            // Convert ug/s to ug/m3 concentration change
            c.pm25 += (src.pm25_rate * dt) / cell_volume;
            // Simplified ppb conversion for NOx
            c.nox += (src.nox_rate * dt) / cell_volume; 
        }
    }
}

} // namespace wrf_chem
