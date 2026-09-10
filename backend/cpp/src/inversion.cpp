#include "inversion.h"

namespace wrf_chem {

InversionResult InversionDetector::detect_inversion(const std::vector<double>& temp_profile, 
                                                    const std::vector<double>& height_profile,
                                                    double pbl_height) {
    InversionResult res = {false, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0};
    
    if (temp_profile.size() < 2) return res;

    for (size_t i = 1; i < temp_profile.size(); ++i) {
        double dt = temp_profile[i] - temp_profile[i-1];
        double dz = height_profile[i] - height_profile[i-1];
        
        if (dt > 0 && dz > 0) { // dT/dz > 0 indicates inversion
            if (!res.inversion_present) {
                res.inversion_present = true;
                res.base_height = height_profile[i-1];
            }
            res.top_height = height_profile[i];
            res.strength = temp_profile[i] - temp_profile[0]; // roughly
        } else if (res.inversion_present) {
            break; // inversion layer ended
        }
    }
    
    if (res.inversion_present) {
        res.depth = res.top_height - res.base_height;
        res.lapse_rate = (res.strength / res.depth) * 100.0;
        
        // Trapping efficiency 0 to 1
        res.trapping_efficiency = std::min(1.0, res.strength * 0.2); // heuristic
        if (pbl_height < res.base_height) {
            res.trapping_efficiency *= 0.5;
        }
    }
    
    return res;
}

std::vector<InversionResult> InversionDetector::detect_grid_inversions(const WRFGrid& grid) {
    std::vector<InversionResult> results(WRFGrid::NX * WRFGrid::NY);
    
    std::vector<double> heights(WRFGrid::NZ);
    for (int z = 0; z < WRFGrid::NZ; ++z) {
        heights[z] = grid.get_level_height(z);
    }
    
    for (int y = 0; y < WRFGrid::NY; ++y) {
        for (int x = 0; x < WRFGrid::NX; ++x) {
            std::vector<double> temps(WRFGrid::NZ);
            for (int z = 0; z < WRFGrid::NZ; ++z) {
                temps[z] = grid.get(x, y, z).temperature;
            }
            double pbl = grid.get(x, y, 0).pbl_height;
            results[y * WRFGrid::NX + x] = detect_inversion(temps, heights, pbl);
        }
    }
    
    return results;
}

} // namespace wrf_chem
