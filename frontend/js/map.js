let map;
let stationMarkers = [];
let heatLayer;

const aqiColors = {
    good: '#00e400',
    satisfactory: '#ffff00',
    moderate: '#ff7e00',
    poor: '#ff0000',
    veryPoor: '#8f3f97',
    severe: '#7e0023'
};

function getAqiColor(aqi) {
    if (aqi <= 50) return aqiColors.good;
    if (aqi <= 100) return aqiColors.satisfactory;
    if (aqi <= 200) return aqiColors.moderate;
    if (aqi <= 300) return aqiColors.poor;
    if (aqi <= 400) return aqiColors.veryPoor;
    return aqiColors.severe;
}

function initMap() {
    // Center on Delhi
    map = L.map('map').setView([28.6139, 77.2090], 10);

    // Dark tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Legend
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.background = 'rgba(26, 26, 46, 0.8)';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.color = 'white';
        div.style.border = '1px solid #2a2a3e';
        
        const ranges = [
            { limit: 50, label: '0-50 Good', color: aqiColors.good },
            { limit: 100, label: '51-100 Sat.', color: aqiColors.satisfactory },
            { limit: 200, label: '101-200 Mod.', color: aqiColors.moderate },
            { limit: 300, label: '201-300 Poor', color: aqiColors.poor },
            { limit: 400, label: '301-400 V.Poor', color: aqiColors.veryPoor },
            { limit: 500, label: '401+ Severe', color: aqiColors.severe }
        ];

        div.innerHTML = '<strong>AQI Scale</strong><br>';
        ranges.forEach(r => {
            div.innerHTML += 
                `<i style="background:${r.color}; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> ${r.label}<br>`;
        });
        return div;
    };
    legend.addTo(map);

    return map;
}

function updateStationMarkers(stationsData) {
    // Clear old markers
    stationMarkers.forEach(m => map.removeLayer(m));
    stationMarkers = [];

    stationsData.forEach(station => {
        const color = getAqiColor(station.aqi);
        const radius = Math.max(8, Math.min(25, station.aqi / 10)); // Scale radius

        const marker = L.circleMarker([station.lat, station.lng], {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        const popupContent = `
            <div style="color: #333; min-width: 150px;">
                <h4 style="margin: 0 0 5px 0;">${station.name}</h4>
                <div style="font-size: 24px; font-weight: bold; color: ${color}; text-shadow: 1px 1px 1px #000;">
                    AQI: ${station.aqi}
                </div>
                <hr style="margin: 5px 0;">
                <div>PM2.5: ${station.pm25} µg/m³</div>
                <div>Temp: ${station.temp}°C</div>
                <div>Wind: ${station.windSpeed} m/s</div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click event to sync with dropdown
        marker.on('click', () => {
            const select = document.getElementById('station-select');
            if(select) {
                select.value = station.id;
                // trigger change event manually
                select.dispatchEvent(new Event('change'));
            }
        });

        stationMarkers.push(marker);
    });
}

function updateHeatmap(heatmapData) {
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }
    
    // heatmapData expected as array of [lat, lng, intensity]
    heatLayer = L.heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {
            0.0: aqiColors.good,
            0.2: aqiColors.satisfactory,
            0.4: aqiColors.moderate,
            0.6: aqiColors.poor,
            0.8: aqiColors.veryPoor,
            1.0: aqiColors.severe
        }
    }).addTo(map);
}

function centerMapOnStation(lat, lng) {
    if(map) {
        map.flyTo([lat, lng], 12, { duration: 1 });
    }
}

window.mapUtils = {
    initMap,
    updateStationMarkers,
    updateHeatmap,
    centerMapOnStation
};
