#pragma once

#include "grid.h"
#include "meteorology.h"
#include "chemistry.h"
#include "dispersion.h"
#include "inversion.h"
#include <vector>

namespace wrf_chem {

class CoupledSimulator {
public:
    CoupledSimulator(double dt = 60.0);

    void initialize(); // Using default ICs for now
    void step();
    void run_forecast(int hours);
    
    void add_stubble_plume(const PlumeSource& src);

    std::vector<WRFGrid> get_hourly_snapshots() const;
    std::vector<GridCell> get_station_values(double lat, double lon) const;
    
    WRFGrid grid;

private:
    double dt;
    MeteorologyEngine meteo;
    ChemistryTransport chem;
    DispersionModel dispersion;
    
    std::vector<PlumeSource> plumes;
    std::vector<WRFGrid> hourly_snapshots;
};

} // namespace wrf_chem
