#include <iostream>
#include <cassert>
#include "../include/grid.h"
#include "../include/inversion.h"
#include "../include/dispersion.h"
#include "../include/coupling.h"

using namespace wrf_chem;

void test_grid() {
    WRFGrid grid;
    grid.initialize();
    assert(grid.get(0, 0, 0).temperature > 0);
    std::cout << "Grid test passed." << std::endl;
}

void test_inversion() {
    std::vector<double> temp = {300, 298, 305, 303}; // Inversion between level 1 and 2
    std::vector<double> height = {10, 50, 100, 200};
    auto res = InversionDetector::detect_inversion(temp, height, 1000);
    assert(res.inversion_present == true);
    assert(res.base_height == 50);
    std::cout << "Inversion test passed." << std::endl;
}

void test_coupling() {
    CoupledSimulator sim(60.0);
    sim.initialize();
    sim.run_forecast(1); // 1 hour
    auto snaps = sim.get_hourly_snapshots();
    assert(snaps.size() == 2); // Init + 1 hr
    std::cout << "Coupling test passed." << std::endl;
}

int main() {
    test_grid();
    test_inversion();
    test_coupling();
    std::cout << "All tests passed successfully!" << std::endl;
    return 0;
}
