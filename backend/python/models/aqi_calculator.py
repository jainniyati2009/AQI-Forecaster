import math
from typing import Dict, Optional, Any

def get_sub_index(conc: float, breakpoints: list) -> float:
    """Calculate sub-index based on CPCB formula."""
    if conc < 0:
        return 0.0
    
    for i in range(len(breakpoints) - 1):
        c_low, c_high, i_low, i_high = breakpoints[i]
        if c_low <= conc <= c_high:
            return ((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low
            
    # If conc exceeds highest breakpoint
    c_low, c_high, i_low, i_high = breakpoints[-1]
    if conc > c_high:
        # Extrapolate
        return ((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low
    return 0.0

def compute_indian_aqi(pm25: float, pm10: Optional[float] = None, o3: Optional[float] = None, no2: Optional[float] = None) -> float:
    """
    Compute Indian AQI based on CPCB breakpoints.
    Returns the maximum sub-index of the provided pollutants.
    """
    # Breakpoints format: (C_low, C_high, I_low, I_high)
    pm25_bp = [
        (0.0, 30.0, 0, 50),
        (31.0, 60.0, 51, 100),
        (61.0, 90.0, 101, 200),
        (91.0, 120.0, 201, 300),
        (121.0, 250.0, 301, 400),
        (251.0, 1000.0, 401, 500) # Extrapolated max
    ]
    
    pm10_bp = [
        (0.0, 50.0, 0, 50),
        (51.0, 100.0, 51, 100),
        (101.0, 250.0, 101, 200),
        (251.0, 350.0, 201, 300),
        (351.0, 430.0, 301, 400),
        (431.0, 1000.0, 401, 500)
    ]
    
    o3_bp = [ # 8-hr avg
        (0.0, 50.0, 0, 50),
        (51.0, 100.0, 51, 100),
        (101.0, 168.0, 101, 200),
        (169.0, 208.0, 201, 300),
        (209.0, 748.0, 301, 400),
        (749.0, 1000.0, 401, 500) # Approximation
    ]
    
    no2_bp = [ # 24-hr avg
        (0.0, 40.0, 0, 50),
        (41.0, 80.0, 51, 100),
        (81.0, 180.0, 101, 200),
        (181.0, 280.0, 201, 300),
        (281.0, 400.0, 301, 400),
        (401.0, 1000.0, 401, 500)
    ]
    
    sub_indices = []
    
    sub_indices.append(get_sub_index(pm25, pm25_bp))
    
    if pm10 is not None:
        sub_indices.append(get_sub_index(pm10, pm10_bp))
    if o3 is not None:
        sub_indices.append(get_sub_index(o3, o3_bp))
    if no2 is not None:
        sub_indices.append(get_sub_index(no2, no2_bp))
        
    return max(sub_indices)

def get_health_advisory(aqi: float) -> Dict[str, str]:
    """Return health advisory dict based on AQI value."""
    aqi_int = int(round(aqi))
    
    if aqi_int <= 50:
        return {
            "color": "green", "color_hex": "#00B050", "label": "Good",
            "mask": "No mask needed", "emoji": "🟢",
            "advisory": "Air quality is considered satisfactory, and air pollution poses little or no risk."
        }
    elif aqi_int <= 100:
        return {
            "color": "yellow", "color_hex": "#FFFF00", "label": "Satisfactory",
            "mask": "No mask needed", "emoji": "🟡",
            "advisory": "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution."
        }
    elif aqi_int <= 200:
        return {
            "color": "orange", "color_hex": "#FFC000", "label": "Moderate",
            "mask": "N95 for sensitive", "emoji": "🟠",
            "advisory": "Members of sensitive groups may experience health effects. The general public is not likely to be affected."
        }
    elif aqi_int <= 300:
        return {
            "color": "red", "color_hex": "#FF0000", "label": "Poor",
            "mask": "N95 or KN95 for all", "emoji": "🔴",
            "advisory": "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."
        }
    elif aqi_int <= 400:
        return {
            "color": "purple", "color_hex": "#7030A0", "label": "Very Poor",
            "mask": "N95 or P100", "emoji": "🟣",
            "advisory": "Health warnings of emergency conditions. The entire population is more likely to be affected."
        }
    else:
        return {
            "color": "maroon", "color_hex": "#800000", "label": "Severe",
            "mask": "P100 or N95 strictly", "emoji": "🟤",
            "advisory": "Health alert: everyone may experience more serious health effects. Avoid all outdoor exertion."
        }

def get_overall_aqi(pollutant_concentrations_dict: Dict[str, float]) -> float:
    """Calculate overall AQI from a dictionary of pollutant concentrations."""
    return compute_indian_aqi(
        pm25=pollutant_concentrations_dict.get('pm25', 0.0),
        pm10=pollutant_concentrations_dict.get('pm10'),
        o3=pollutant_concentrations_dict.get('o3'),
        no2=pollutant_concentrations_dict.get('no2')
    )
