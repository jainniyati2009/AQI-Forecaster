#pragma once

#include <vector>
#include "grid.h"

namespace wrf_chem {

struct InversionResult {
    bool inversion_present;
    double base_height; // m
    double top_height;  // m
    double strength;    // K
    double depth;       // m
    double lapse_rate;  // C/100m
    double trapping_efficiency; // 0-1
};

class InversionDetector {
public:
    static InversionResult detect_inversion(const std::vector<double>& temp_profile, 
                                            const std::vector<double>& height_profile,
                                            double pbl_height);
    
    // Grid-wide detection, returns result for each column (x, y) -> index y * NX + x
    static std::vector<InversionResult> detect_grid_inversions(const WRFGrid& grid);
};

} // namespace wrf_chem
