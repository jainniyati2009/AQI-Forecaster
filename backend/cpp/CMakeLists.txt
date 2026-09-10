cmake_minimum_required(VERSION 3.15)
project(wrf_chem_core VERSION 1.0 DESCRIPTION "WRF Chem Core")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS_RELEASE "-O2")
set(CMAKE_CXX_FLAGS_DEBUG "-g")

# Find OpenMP
find_package(OpenMP)
if(OpenMP_CXX_FOUND)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenMP_CXX_FLAGS}")
endif()

# Find pybind11
find_package(pybind11 CONFIG)
if(NOT pybind11_FOUND)
    include(FetchContent)
    FetchContent_Declare(
      pybind11
      GIT_REPOSITORY https://github.com/pybind/pybind11.git
      GIT_TAG v2.11.1
    )
    FetchContent_MakeAvailable(pybind11)
endif()

include_directories(include)

set(CORE_SOURCES
    src/grid.cpp
    src/meteorology.cpp
    src/chemistry.cpp
    src/inversion.cpp
    src/dispersion.cpp
    src/coupling.cpp
)

pybind11_add_module(wrf_chem_core src/bindings.cpp ${CORE_SOURCES})

add_executable(test_core tests/test_core.cpp ${CORE_SOURCES})
if(OpenMP_CXX_FOUND)
    target_link_libraries(test_core PUBLIC OpenMP::OpenMP_CXX)
endif()
