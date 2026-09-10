#include "dispersion.h"
#include <cmath>
#include <algorithm>

namespace wrf_chem {

double DispersionModel::compute_plume_concentration(double x, double y, double z, const PlumeSource& source, double u, char stability, double inv_h) {
    if (x <= 0) return 0.0; // Upwind

    // Simplified Pasquill-Gifford parameters based on stability (A-F)
    double a_y, b_y, a_z, b_z;
    switch(stability) {
        case 'A': a_y = 0.22; b_y = 0.0001; a_z = 0.20; b_z = 0; break;
        case 'D': a_y = 0.08; b_y = 0.0001; a_z = 0.06; b_z = 0.0015; break;
        case 'F': a_y = 0.04; b_y = 0.0001; a_z = 0.016; b_z = 0.0003; break;
        default:  a_y = 0.08; b_y = 0.0001; a_z = 0.06; b_z = 0.0015; break;
    }

    double sigma_y = a_y * x * std::pow(1.0 + b_y * x, -0.5);
    double sigma_z = a_z * x * std::pow(1.0 + b_z * x, -0.5);

    double H = source.effective_stack_height;
    if (u < 0.5) u = 0.5;

    double coeff = source.strength / (2.0 * M_PI * u * sigma_y * sigma_z);
    double y_term = std::exp(-0.5 * (y * y) / (sigma_y * sigma_y));
    
    // Vertical term with reflection from ground and inversion
    double z_term = std::exp(-0.5 * std::pow(z - H, 2) / (sigma_z * sigma_z)) +
                    std::exp(-0.5 * std::pow(z + H, 2) / (sigma_z * sigma_z));
    
    if (inv_h > H) {
        // Reflection from inversion layer
        z_term += std::exp(-0.5 * std::pow(z - (2.0 * inv_h - H), 2) / (sigma_z * sigma_z));
    }

    return coeff * y_term * z_term;
}

void DispersionModel::add_stubble_burning_plume(WRFGrid& grid, const PlumeSource& source, double wind_speed, double wind_dir, char stability_class, double inversion_height) {
    auto [src_x, src_y] = grid.latlon_to_grid(source.lat, source.lon);
    
    double wd_rad = wind_dir * M_PI / 180.0;
    double wind_vec_x = -std::sin(wd_rad);
    double wind_vec_y = -std::cos(wd_rad);
    
    for (int z = 0; z < WRFGrid::NZ; ++z) {
        for (int y = 0; y < WRFGrid::NY; ++y) {
            for (int x = 0; x < WRFGrid::NX; ++x) {
                double dx = (x - src_x) * WRFGrid::DX;
                double dy = (y - src_y) * WRFGrid::DY;
                
                // Rotate coordinates to downwind direction
                double downwind_x = dx * wind_vec_x + dy * wind_vec_y;
                double crosswind_y = -dx * wind_vec_y + dy * wind_vec_x;
                
                double height = grid.get_level_height(z);
                
                double conc = compute_plume_concentration(downwind_x, crosswind_y, height, source, wind_speed, stability_class, inversion_height);
                
                grid.get(x, y, z).pm25 += conc;
            }
        }
    }
}

} // namespace wrf_chem
