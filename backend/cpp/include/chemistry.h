#pragma once

#include "grid.h"
#include <vector>

namespace wrf_chem {

struct EmissionSource {
    int grid_x;
    int grid_y;
    double pm25_rate; // ug/s
    double nox_rate;  // ug/s
    bool is_area;
};

class ChemistryTransport {
public:
    ChemistryTransport(double dt = 60.0);

    void step(WRFGrid& grid);
    void add_source(const EmissionSource& source);

private:
    double dt;
    std::vector<EmissionSource> sources;

    void advect_species(WRFGrid& grid);
    void apply_chemistry(WRFGrid& grid);
    void apply_deposition(WRFGrid& grid);
    void add_emissions(WRFGrid& grid);
};

} // namespace wrf_chem
