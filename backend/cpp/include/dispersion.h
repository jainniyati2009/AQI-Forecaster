#pragma once

#include "grid.h"

namespace wrf_chem {

struct PlumeSource {
    double lat;
    double lon;
    double strength; // ug/m3/s or ug/s
    double effective_stack_height; // m
};

class DispersionModel {
public:
    void add_stubble_burning_plume(WRFGrid& grid, const PlumeSource& source, double wind_speed, double wind_dir, char stability_class, double inversion_height);

private:
    double compute_plume_concentration(double x, double y, double z, const PlumeSource& source, double u, char stability, double inv_h);
};

} // namespace wrf_chem
  