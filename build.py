import sys
import subprocess
import os
from pathlib import Path

def print_step(msg):
    print(f"\n\033[1;34m=== {msg} ===\033[0m")

def print_warning(msg):
    print(f"\033[1;33mWARNING: {msg}\033[0m")

def check_python_version():
    print_step("Checking Python Version")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 10):
        print("\033[1;31mError: Python 3.10 or higher is required.\033[0m")
        sys.exit(1)
    print(f"Python version {version.major}.{version.minor}.{version.micro} detected. OK.")

def install_requirements():
    print_step("Installing Python Dependencies")
    req_path = Path("backend") / "requirements.txt"
    if not req_path.exists():
        print_warning(f"requirements.txt not found at {req_path}")
        return
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(req_path)])
        print("Dependencies installed successfully.")
    except subprocess.CalledProcessError:
        print_warning("Failed to install dependencies.")

def build_cpp_module():
    print_step("Building C++ WRF-Chem Bridge Module")
    # Simplistic check for cmake
    try:
        subprocess.check_call(["cmake", "--version"], stdout=subprocess.DEVNULL)
    except FileNotFoundError:
        print_warning("CMake not found. Skipping C++ compilation. System will use Python fallback mode.")
        return

    build_dir = Path("backend") / "cpp" / "build"
    try:
        build_dir.mkdir(parents=True, exist_ok=True)
        subprocess.check_call(["cmake", ".."], cwd=build_dir)
        subprocess.check_call(["cmake", "--build", "."], cwd=build_dir)
        print("C++ module compiled successfully.")
    except Exception as e:
        print_warning(f"C++ compilation failed: {e}. System will use Python fallback mode.")

def check_tf_model():
    print_step("Checking TensorFlow Model")
    model_path = Path("backend") / "python" / "saved_models" / "aqi_adjuster_v1"
    if not model_path.exists():
        print_warning("Trained model not found. Fallback mode will be used during API execution.")
        print("Tip: Run model training script (if available) to generate ML models.")
    else:
        print("TensorFlow model found.")

def main():
    print("\033[1;32mDelhi NCR AQI Forecast System - Build Script\033[0m")
    check_python_version()
    install_requirements()
    build_cpp_module()
    check_tf_model()
    
    print_step("Build Summary")
    print("Build process completed. If C++ or TF models failed/skipped, the API will automatically use realistic fallback data.")
    
    start = input("\nDo you want to start the API server now? (y/n): ")
    if start.lower() == 'y':
        print_step("Starting Uvicorn Server")
        main_path = Path("backend") / "python" / "main.py"
        subprocess.run([sys.executable, str(main_path)])

if __name__ == "__main__":
    main()
