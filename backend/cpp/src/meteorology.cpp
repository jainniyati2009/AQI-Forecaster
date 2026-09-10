#include "meteorology.h"
#include <cmath>

namespace wrf_chem {

MeteorologyEngine::MeteorologyEngine(double dt) : dt(dt) {}

void MeteorologyEngine::step(WRFGrid& grid) {
    apply_radiation_feedback(grid);
    surface_energy_balance(grid);
    estimate_pbl_height(grid);
    compute_wind_tendency(grid);
    advect_temperature(grid);
}

void MeteorologyEngine::advect_temperature(WRFGrid& grid) {
    // Simplified upwind advection
    WRFGrid grid_next = grid; // Inefficient but simple for now
    for (int z = 0; z < WRFGrid::NZ; ++z) {
        for (int y = 1; y < WRFGrid::NY - 1; ++y) {
            for (int x = 1; x < WRFGrid::NX - 1; ++x) {
                const auto& c = grid.get(x, y, z);
                double dt_dx = (c.wind_u > 0) ? (c.temperature - grid.get(x-1, y, z).temperature) / WRFGrid::DX :
                                                (grid.get(x+1, y, z).temperature - c.temperature) / WRFGrid::DX;
                double dt_dy = (c.wind_v > 0) ? (c.temperature - grid.get(x, y-1, z).temperature) / WRFGrid::DY :
                                                (grid.get(x, y+1, z).temperature - c.temperature) / WRFGrid::DY;
                
                grid_next.get(x, y, z).temperature -= dt * (c.wind_u * dt_dx + c.wind_v * dt_dy);
            }
        }
    }
    grid = grid_next;
}

void MeteorologyEngine::compute_wind_tendency(WRFGrid& grid) {
    // Simplified horizontal wind with Coriolis
    double omega = 7.2921e-5;
    double f = 2.0 * omega * std::sin(WRFGrid::LAT_CENTER * M_PI / 180.0);
    
    for (int z = 0; z < WRFGrid::NZ; ++z) {
        for (int y = 0; y < WRFGrid::NY; ++y) {
            for (int x = 0; x < WRFGrid::NX; ++x) {
                auto& c = grid.get(x, y, z);
                double du_dt = f * c.wind_v;
                double dv_dt = -f * c.wind_u;
                c.wind_u += du_dt * dt;
                c.wind_v += dv_dt * dt;
            }
        }
    }
}

void MeteorologyEngine::estimate_pbl_height(WRFGrid& grid) {
    // Simplified bulk Richardson number method
    for (int y = 0; y < WRFGrid::NY; ++y) {
        for (int x = 0; x < WRFGrid::NX; ++x) {
            double surface_theta = grid.get(x, y, 0).temperature; // Approx potential temp at surface
            double pbl = 100.0; // Minimum PBL
            
            for (int z = 1; z < WRFGrid::NZ; ++z) {
                const auto& c = grid.get(x, y, z);
                double theta_z = c.temperature + 0.0098 * grid.get_level_height(z);
                double u_z = c.wind_u;
                double v_z = c.wind_v;
                double wind_speed_sq = u_z * u_z + v_z * v_z;
                
                if (wind_speed_sq < 1e-6) wind_speed_sq = 1e-6;
                
                double Ri = (9.81 / surface_theta) * (theta_z - surface_theta) * grid.get_level_height(z) / wind_speed_sq;
                if (Ri > 0.25) { // Critical Richardson number
                    pbl = grid.get_level_height(z);
                    break;
                }
            }
            
            for (int z = 0; z < WRFGrid::NZ; ++z) {
                grid.get(x, y, z).pbl_height = pbl;
            }
        }
    }
}

void MeteorologyEngine::apply_radiation_feedback(WRFGrid& grid) {
    // PM2.5 reduces solar radiation -> lowers surface temp
    for (int y = 0; y < WRFGrid::NY; ++y) {
        for (int x = 0; x < WRFGrid::NX; ++x) {
            double col_pm25 = 0;
            for (int z = 0; z < WRFGrid::NZ; ++z) {
                col_pm25 += grid.get(x, y, z).pm25 * (z == 0 ? grid.get_level_height(0) : grid.get_level_height(z) - grid.get_level_height(z-1));
            }
            // Simple heuristic cooling
            double cooling = col_pm25 * 1e-6 * dt; 
            grid.get(x, y, 0).temperature -= cooling;
        }
    }
}

void MeteorologyEngine::surface_energy_balance(WRFGrid& grid) {
    // Placeholder for surface energy balance
    // Diurnal cycle approximation
    // To make it simple, we don't simulate actual time of day here, handled by external driver or ignored.
}

} // namespace wrf_chem
