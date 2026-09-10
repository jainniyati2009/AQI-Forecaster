#pragma once

#include "grid.h"

namespace wrf_chem {

class MeteorologyEngine {
public:
    MeteorologyEngine(double dt = 60.0);

    void step(WRFGrid& grid);

private:
    double dt;

    void advect_temperature(WRFGrid& grid);
    void compute_wind_tendency(WRFGrid& grid);
    void estimate_pbl_height(WRFGrid& grid);
    void apply_radiation_feedback(WRFGrid& grid);
    void surface_energy_balance(WRFGrid& grid);
};

} // namespace wrf_chem
