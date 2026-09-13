cmake_minimum_required(VERSION 3.14)
project(AirAwareBackend)

set(CMAKE_CXX_STANDARD 17)

# We will use FetchContent to grab cpp-httplib and nlohmann_json
include(FetchContent)

# Fetch cpp-httplib (Header only)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG        v0.14.1
)
FetchContent_MakeAvailable(httplib)

# Fetch nlohmann_json (Header only)
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG        v3.11.2
)
FetchContent_MakeAvailable(json)

# Fetch ONNX Runtime (Download pre-built binary for Windows x64)
# Note: For MinGW, linking against MSVC DLLs using the C API is generally safe.
set(ONNXRUNTIME_VERSION "1.16.3")
set(ONNXRUNTIME_URL "https://github.com/microsoft/onnxruntime/releases/download/v${ONNXRUNTIME_VERSION}/onnxruntime-win-x64-${ONNXRUNTIME_VERSION}.zip")

FetchContent_Declare(
    onnxruntime
    URL ${ONNXRUNTIME_URL}
)
FetchContent_MakeAvailable(onnxruntime)

# Define the executable
add_executable(server server.cpp)

# Include directories
target_include_directories(server PRIVATE 
    ${httplib_SOURCE_DIR} 
    ${json_SOURCE_DIR}/single_include
    ${onnxruntime_SOURCE_DIR}/include
)

# Link libraries (Winsock for httplib, ONNX Runtime)
target_link_libraries(server PRIVATE 
    ws2_32 
    crypt32
    ${onnxruntime_SOURCE_DIR}/lib/onnxruntime.lib
)

# Copy the ONNX Runtime DLL and the trained model to the output directory so the server can run
add_custom_command(TARGET server POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${onnxruntime_SOURCE_DIR}/lib/onnxruntime.dll"
        $<TARGET_FILE_DIR:server>
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CMAKE_SOURCE_DIR}/../model_training/model.onnx"
        $<TARGET_FILE_DIR:server>
)
