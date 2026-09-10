document.addEventListener('DOMContentLoaded', init);

async function init() {
    // 1. Initialize Visuals
    window.mapUtils.initMap();
    window.chartUtils.initForecastChart('forecast-chart');
    window.chartUtils.initPollutantChart('pollutant-chart');
    window.chartUtils.initInversionChart('inversion-chart');
    window.healthUtils.renderAQITable();

    // 2. Setup event listeners
    document.getElementById('station-select').addEventListener('change', (e) => {
        onStationSelected(e.target.value);
    });

    // 3. Initial Data Fetch
    await refreshData();

    // 4. Set Interval for auto-refresh (60s)
    setInterval(refreshData, 60000);
}

async function refreshData() {
    updateTimestamp();

    try {
        // Fetch Parallel Data
        const [stations, current, forecast, inversion, stubble] = await Promise.all([
            window.api.getStations(),
            window.api.getCurrentAQI(),
            window.api.getForecasts(),
            window.api.getInversion(),
            window.api.getStubbleStatus()
        ]);

        // Populate Stations Dropdown
        updateStationDropdown(stations);

        // Update Map
        window.mapUtils.updateStationMarkers(stations);
        
        // Update Header and Global Stats
        updateOverallHeader(current.aqi, current.timestamp);
        
        // Find Peak AQI
        let peakAqi = 0;
        let peakTime = '';
        if(forecast.hours && forecast.hours.length > 0) {
            forecast.hours.forEach(h => {
                if (h.calibrated > peakAqi) {
                    peakAqi = h.calibrated;
                    peakTime = new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }
            });
        }

        // Update Stat Cards
        updateStatsCards(current.aqi, peakAqi, peakTime, inversion.currentStrength, stubble);

        // Update Charts (using overall forecast by default, or selected)
        const selectedStation = document.getElementById('station-select').value;
        if(selectedStation === 'all') {
            window.chartUtils.updateForecastChart(forecast);
            window.chartUtils.updatePollutantChart(forecast);
            window.healthUtils.updateHealthAdvisory(current.aqi);
        } else {
            onStationSelected(selectedStation); // Will refetch specific if needed
        }

        // Update Inversion Monitor
        window.inversionUtils.updateInversionGauge(inversion.currentStrength);
        window.inversionUtils.updateInversionProfile(inversion.profile);
        window.chartUtils.updateInversionTimeline(inversion.timeline);

        // Update Stubble Tracker
        updateStubbleTracker(stubble);

        // Load Heatmap data
        const heatmap = await window.api.getHeatmap(0);
        window.mapUtils.updateHeatmap(heatmap);

    } catch (e) {
        console.error("Error refreshing data:", e);
        // Implement toast notification here if needed
    }
}

async function onStationSelected(stationId) {
    try {
        let forecastData, currentAqi;

        if (stationId === 'all') {
            forecastData = await window.api.getForecasts();
            const current = await window.api.getCurrentAQI();
            currentAqi = current.aqi;
            window.mapUtils.centerMapOnStation(28.6139, 77.2090);
        } else {
            // Find station details
            const stations = await window.api.getStations();
            const station = stations.find(s => s.id === stationId);
            
            if(station) {
                currentAqi = station.aqi;
                window.mapUtils.centerMapOnStation(station.lat, station.lng);
            }
            
            // In a real app, fetch station specific forecast. Using overall for mock.
            forecastData = await window.api.getForecasts(); 
        }

        window.chartUtils.updateForecastChart(forecastData);
        window.chartUtils.updatePollutantChart(forecastData);
        window.healthUtils.updateHealthAdvisory(currentAqi);

    } catch (e) {
        console.error("Error updating station data", e);
    }
}

function updateStationDropdown(stations) {
    const select = document.getElementById('station-select');
    // Keep 'all' option, clear others
    select.innerHTML = '<option value="all">All Stations (Delhi Avg)</option>';
    
    stations.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = `${st.name} (AQI: ${st.aqi})`;
        select.appendChild(opt);
    });
}

function updateOverallHeader(aqi, timestamp) {
    const badge = document.getElementById('overall-aqi-badge');
    badge.querySelector('.badge-value').innerText = aqi;
    
    let cat = 'Loading', color = '#555';
    if (aqi <= 50) { cat="Good"; color="#00e400"; }
    else if (aqi <= 100) { cat="Satisfactory"; color="#ffff00"; }
    else if (aqi <= 200) { cat="Moderate"; color="#ff7e00"; }
    else if (aqi <= 300) { cat="Poor"; color="#ff0000"; }
    else if (aqi <= 400) { cat="Very Poor"; color="#8f3f97"; }
    else { cat="Severe"; color="#7e0023"; }

    badge.querySelector('.badge-label').innerText = cat;
    badge.style.borderColor = color;
    badge.style.boxShadow = `0 0 15px ${color}`;
    
    const isDark = ['#ff0000', '#8f3f97', '#7e0023'].includes(color);
    badge.querySelector('.badge-value').style.color = isDark ? '#fff' : '#111';
    badge.querySelector('.badge-label').style.color = isDark ? '#ddd' : '#222';
    badge.style.backgroundColor = color;
}

function updateStatsCards(currentAqi, peakAqi, peakTime, inversionStrength, stubble) {
    // Current AQI
    document.getElementById('stat-val-current').innerText = currentAqi;
    const catSpan = document.getElementById('stat-cat-current');
    if (currentAqi <= 50) catSpan.innerText="Good";
    else if (currentAqi <= 100) catSpan.innerText="Satisfactory";
    else if (currentAqi <= 200) catSpan.innerText="Moderate";
    else if (currentAqi <= 300) catSpan.innerText="Poor";
    else if (currentAqi <= 400) catSpan.innerText="Very Poor";
    else catSpan.innerText="Severe";

    // Peak AQI
    document.getElementById('stat-val-peak').innerText = Math.round(peakAqi);
    document.getElementById('stat-time-peak').innerText = `at ${peakTime}`;

    // Inversion
    document.getElementById('stat-val-inversion').innerText = inversionStrength.toFixed(1) + ' °C';

    // Stubble
    document.getElementById('stat-val-stubble').innerText = stubble.active ? 'Active' : 'Inactive';
    document.getElementById('stat-int-stubble').innerText = `${stubble.intensity}% Intensity`;
    if(stubble.active) {
        document.getElementById('stat-val-stubble').style.color = '#ff7e00';
    }
}

function updateStubbleTracker(stubble) {
    document.getElementById('stubble-season').innerText = stubble.season;
    document.getElementById('stubble-intensity-fill').style.width = `${stubble.intensity}%`;
    document.getElementById('stubble-contribution').innerText = `${stubble.contributionPct}%`;

    const arrow = document.getElementById('wind-arrow');
    const label = document.getElementById('wind-dir-label');
    
    arrow.style.transform = `rotate(${stubble.windDir}deg)`;
    
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    const dirIdx = Math.round(stubble.windDir / 45) % 8;
    label.innerText = dirs[dirIdx];
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('last-updated-time').innerText = now.toLocaleString();
}
