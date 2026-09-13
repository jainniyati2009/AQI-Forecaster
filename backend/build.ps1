# Build script for AirAware Backend using MinGW
Write-Host "Creating build directory..."
if (-Not (Test-Path "build")) {
    New-Item -ItemType Directory -Force -Path "build" | Out-Null
}
Set-Location "build"

Write-Host "Configuring CMake for MinGW Makefiles..."
cmake -G "MinGW Makefiles" ..

Write-Host "Building project..."
cmake --build . --config Release

Write-Host "Build complete! You can run the server using: .\server.exe"
Set-Location ".."
