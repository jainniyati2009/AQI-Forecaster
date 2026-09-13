// AirAware — Multi-Page Desktop Landscape Logic & Navigation
let currentTheme = 'theme-dark';
let selectedLocation = 'Rohini, Delhi';
let aqiForecastData = [];
let selectedDateIndex = 0;
let map = null;

const TIME_STAMPS = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];

// ==================== AQI HELPER ====================
function getAQIInfo(val) {
    const aqi = Math.round(val);
    if (aqi <= 50) return { color: 'green', hex: '#00E400', category: 'Good', mask: 'No mask needed', desc: 'Ideal air quality. Enjoy outdoor activities.' };
    if (aqi <= 100) return { color: 'yellow', hex: '#FFFF00', category: 'Moderate', mask: 'No mask needed', desc: 'Acceptable. Unusually sensitive people should limit heavy outdoor exertion.' };
    if (aqi <= 150) return { color: 'orange', hex: '#FF7E00', category: 'Unhealthy for Sensitive Groups', mask: 'N95 for sensitive groups', desc: 'Sensitive groups (asthma, elderly, children) should wear N95 and limit time outside.' };
    if (aqi <= 200) return { color: 'red', hex: '#FF0000', category: 'Unhealthy', mask: 'N95 or KN95 for all', desc: 'Everyone should wear a well-fitted N95. Cloth masks will NOT protect against PM2.5. Avoid heavy outdoor exertion.' };
    if (aqi <= 300) return { color: 'purple', hex: '#8F3F97', category: 'Very Unhealthy', mask: 'N95 or P100 required', desc: 'Health alert. Everyone should wear an N95. Stay indoors and keep windows closed.' };
    return { color: 'maroon', hex: '#7E0023', category: 'Hazardous', mask: 'P100 or N95 strictly', desc: 'Emergency conditions. P100 (HEPA-equivalent) is ideal. Stop all outdoor activities.' };
}

// ==================== PAGE NAVIGATION ====================
function navTo(screenId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        // If navigating to map confirm screen, make sure Leaflet map invalidates size
        if (screenId === 'screen-confirm' && map) {
            setTimeout(() => { map.invalidateSize(); }, 200);
        }
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initThemePicker();
    initMap();
    fetchForecastData();

    // Auto-advance from splash after 2.8s
    setTimeout(() => {
        const splash = document.getElementById('screen-splash');
        if (splash && splash.classList.contains('active')) {
            navTo('screen-theme');
        }
    }, 2800);
});

// ==================== SCREEN 2: THEME PICKER ====================
function initThemePicker() {
    const cards = document.querySelectorAll('.theme-card-dt');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => {
                c.classList.remove('active');
                const chk = c.querySelector('.check-icon');
                if (chk) { chk.className = 'fa-regular fa-circle check-icon'; }
            });
            card.classList.add('active');
            const chk = card.querySelector('.check-icon');
            if (chk) { chk.className = 'fa-solid fa-circle-check check-icon'; }
            currentTheme = card.getAttribute('data-theme');
            document.body.className = currentTheme;
        });
    });

    const applyBtn = document.getElementById('btn-apply-theme');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            navTo('screen-search');
        });
    }
}

// ==================== SCREEN 4: MAP ====================
function initMap() {
    const el = document.getElementById('real-map');
    if (!el) return;
    map = L.map('real-map', { zoomControl: false, attributionControl: false }).setView([28.7041, 77.1025], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    addMapMarker(28.7041, 77.1025);

    // Stubble burning fire hotspots (Punjab/Haryana)
    const fireLocations = [[30.9, 75.8], [30.4, 76.3], [29.9, 76.0], [30.1, 75.5], [30.7, 76.6]];
    fireLocations.forEach(([lat, lng]) => {
        const fireIcon = L.divIcon({
            className: 'fire-marker',
            html: `<div style="background:rgba(255,0,0,0.75);width:14px;height:14px;border-radius:50%;box-shadow:0 0 10px rgba(255,0,0,0.9);border:1px solid #fff;"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7]
        });
        L.marker([lat, lng], { icon: fireIcon }).addTo(map);
    });
}

function addMapMarker(lat, lng) {
    const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background:var(--c-orange);width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;justify-content:center;align-items:center;box-shadow:0 3px 10px rgba(0,0,0,0.6);border:2px solid #fff;">
                 <i class="fa-solid fa-location-dot" style="transform:rotate(45deg);color:#fff;font-size:13px;"></i>
               </div>`,
        iconSize: [30, 30], iconAnchor: [15, 30]
    });
    L.marker([lat, lng], { icon }).addTo(map);
}

// ==================== SCREEN 3: LOCATION SELECTION ====================
function selectLocation(locName) {
    selectedLocation = locName === 'Current Location' ? 'Rohini, Delhi' : locName;

    // Update displays across pages
    const confirmPill = document.getElementById('confirm-location-text');
    if (confirmPill) confirmPill.textContent = selectedLocation;
    const sheetLoc = document.getElementById('sheet-location-name');
    if (sheetLoc) sheetLoc.textContent = `${selectedLocation}, India`;
    const dashLoc = document.getElementById('dashboard-location');
    if (dashLoc) dashLoc.innerHTML = `${selectedLocation} <i class="fa-solid fa-chevron-down text-small"></i>`;
    const sdLoc = document.getElementById('sd-location');
    if (sdLoc) sdLoc.textContent = selectedLocation;

    const coords = locName.includes('Anand') ? [28.6289, 77.3162] :
                   locName.includes('Connaught') ? [28.6315, 77.2167] :
                   locName.includes('Noida') ? [28.6280, 77.3649] :
                   locName.includes('Gurugram') ? [28.4595, 77.0266] :
                   locName.includes('Ghaziabad') ? [28.6692, 77.4538] : [28.7041, 77.1025];

    if (map) {
        map.setView(coords, 11);
        addMapMarker(coords[0], coords[1]);
    }

    // Update confirm card AQI
    const baseAQI = 142;
    const info = getAQIInfo(baseAQI);
    const confirmNum = document.getElementById('confirm-aqi-val');
    if (confirmNum) {
        confirmNum.textContent = baseAQI;
        confirmNum.className = `confirm-aqi-num text-${info.color}`;
    }
    const confirmDot = document.getElementById('confirm-aqi-dot');
    if (confirmDot) confirmDot.className = `dot large bg-${info.color}`;
    const confirmTxt = document.getElementById('confirm-aqi-text');
    if (confirmTxt) {
        confirmTxt.textContent = info.category;
        confirmTxt.className = `font-bold text-small text-${info.color}`;
    }

    navTo('screen-confirm');
}

function loadForecastPage() {
    navTo('screen-forecast');
    renderForecastList();
}

// ==================== DATA FETCHING ====================
async function fetchForecastData() {
    const days = ['Today', 'Sat, 5 Sep', 'Sun, 6 Sep', 'Mon, 7 Sep', 'Tue, 8 Sep', 'Wed, 9 Sep', 'Thu, 10 Sep'];
    const fullDays = ['Today, 4 September', 'Saturday, 5 September', 'Sunday, 6 September', 'Monday, 7 September', 'Tuesday, 8 September', 'Wednesday, 9 September', 'Thursday, 10 September'];
    const baseAQIs = [142, 118, 86, 74, 156, 201, 96];
    const wrfRawAQIs = [128, 110, 82, 72, 138, 178, 92];

    const mockData = baseAQIs.map((aqi, i) => {
        const info = getAQIInfo(aqi);
        const hourly_aqi = [
            Math.round(aqi * 0.70), Math.round(aqi * 0.80), Math.round(aqi * 0.93),
            Math.round(aqi * 1.12), Math.round(aqi * 1.18), Math.round(aqi * 1.10),
            Math.round(aqi * 0.96), Math.round(aqi * 0.85), Math.round(aqi * 0.74)
        ];
        return {
            date: days[i], full_date_string: fullDays[i],
            aqi, wrf_raw: wrfRawAQIs[i], tf_adjustment: aqi - wrfRawAQIs[i],
            safety: info,
            pm25: Math.round(aqi * 0.55), pm10: Math.round(aqi * 0.85),
            o3: 42 + (i * 3) % 25, no2: 26 + (i * 4) % 20, so2: 12 + (i * 2) % 10,
            min_aqi: Math.min(...hourly_aqi), max_aqi: Math.max(...hourly_aqi),
            hourly_temps: [24, 26, 29, 32, 31, 29, 27, 25, 24],
            hourly_aqi: hourly_aqi
        };
    });

    aqiForecastData = mockData;

    try {
        const response = await fetch('http://localhost:8081/api/forecast');
        if (response.ok) {
            const apiData = await response.json();
            if (Array.isArray(apiData) && apiData.length > 0) {
                aqiForecastData = apiData.map((d, i) => ({
                    ...d,
                    wrf_raw: d.wrf_raw || Math.round(d.aqi * 0.9),
                    tf_adjustment: d.tf_adjustment || Math.round(d.aqi * 0.1),
                    safety: d.safety || getAQIInfo(d.aqi),
                    hourly_aqi: d.hourly_aqi || mockData[i].hourly_aqi
                }));
            }
        }
    } catch (e) {
        console.log("AirAware: Running in mock WRF-Chem demo mode.");
    }
}

// ==================== SCREEN 5: 7-DAY FORECAST LIST ====================
function renderForecastList() {
    const container = document.getElementById('forecast-list-container');
    if (!container) return;
    container.innerHTML = '';

    let bestIdx = 0, minAqi = 999;
    aqiForecastData.forEach((day, idx) => {
        if (day.aqi < minAqi) { minAqi = day.aqi; bestIdx = idx; }
        const info = day.safety || getAQIInfo(day.aqi);
        const row = document.createElement('div');
        row.className = 'forecast-row';
        row.innerHTML = `
            <div class="f-left">
                <span class="f-date">${day.date}</span>
                <span class="f-aqi text-${info.color}">${Math.round(day.aqi)}</span>
                <span class="f-cat"><span class="dot bg-${info.color}"></span><span class="text-${info.color}">${info.category}</span></span>
            </div>
            <i class="fa-solid fa-chevron-right text-muted"></i>
        `;
        row.onclick = () => {
            selectedDateIndex = idx;
            renderSelectedDateView(idx);
            navTo('screen-details');
        };
        container.appendChild(row);
    });

    // Best Day Highlight Box
    const best = aqiForecastData[bestIdx];
    const bInfo = best.safety || getAQIInfo(best.aqi);
    const bc = document.getElementById('best-day-card');
    if (bc) {
        bc.innerHTML = `
            <div class="flex-between align-center">
                <div>
                    <span class="text-small text-green font-bold"><i class="fa-solid fa-leaf"></i> Best Day to Go Outside</span>
                    <h2 class="mt-small">${best.date}</h2>
                    <p class="text-small mt-small text-muted">AQI around <span class="text-${bInfo.color} font-bold">${Math.round(best.aqi)} <span class="dot bg-${bInfo.color}"></span></span></p>
                    <p class="text-small text-muted">Clearest air in next 7 days</p>
                </div>
                <i class="fa-solid fa-cloud-sun fa-3x text-green opacity-40"></i>
            </div>
        `;
    }
}

// ==================== SCREEN 6: SELECTED DATE DETAILS ====================
function renderSelectedDateView(index) {
    const day = aqiForecastData[index];
    const info = day.safety || getAQIInfo(day.aqi);

    document.getElementById('selected-date-title').textContent = day.full_date_string || day.date;
    const aqiVal = document.getElementById('sd-aqi-val');
    aqiVal.textContent = Math.round(day.aqi);
    aqiVal.className = `text-${info.color}`;
    document.getElementById('sd-aqi-dot').className = `dot extra-large bg-${info.color}`;
    const aqiTxt = document.getElementById('sd-aqi-text');
    aqiTxt.textContent = info.category;
    aqiTxt.className = `font-bold text-${info.color}`;

    // WRF-Chem vs TF Model 2
    document.getElementById('wrf-raw').textContent = day.wrf_raw || Math.round(day.aqi * 0.9);
    const tfAdj = document.getElementById('tf-adjusted');
    tfAdj.textContent = Math.round(day.aqi);
    tfAdj.className = `text-${info.color}`;

    const adj = day.tf_adjustment || Math.round(day.aqi * 0.1);
    const adjSign = adj >= 0 ? '+' : '';
    const reasonEl = document.getElementById('adjust-reason');
    if (reasonEl) {
        reasonEl.innerHTML = `<i class="fa-solid fa-fire text-orange"></i> ${adjSign}${adj} pts: Stubble burning season + weekday traffic`;
    }

    // Scale Marker
    const marker = document.getElementById('sd-scale-marker');
    if (marker) { marker.style.left = `${Math.min(100, Math.max(0, (day.aqi / 350) * 100))}%`; }

    // Summary
    document.getElementById('sd-min').textContent = Math.round(day.min_aqi || day.aqi * 0.7);
    document.getElementById('sd-max').textContent = Math.round(day.max_aqi || day.aqi * 1.25);
    document.getElementById('sd-avg').textContent = Math.round(day.aqi);
    document.getElementById('sd-pm25-val').textContent = Math.round(day.pm25);

    // Hourly AQI Graph + Strip Cards + Temp Cards
    renderHourlyAQIGraph(day.hourly_aqi || [100, 110, 120, 140, 156, 140, 125, 115, 105]);
    renderHourlyAQICards(day.hourly_aqi || [100, 110, 120, 140, 156, 140, 125, 115, 105]);
    renderHourlyTempCards(day.hourly_temps || [24, 26, 29, 32, 31, 29, 27, 25, 24]);

    // Pollutants
    const updateGauge = (id, val, hex) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = Math.round(val);
        el.parentElement.style.setProperty('--perc', Math.min(100, (val / 200) * 100));
        el.parentElement.style.setProperty('--c', hex);
    };
    updateGauge('sd-g-pm25', day.pm25, '#FF7E00');
    updateGauge('sd-g-pm10', day.pm10, '#FF0000');
    updateGauge('sd-g-o3', day.o3, '#00E400');
    updateGauge('sd-g-no2', day.no2, '#00E400');
    updateGauge('sd-g-so2', day.so2, '#00E400');

    // Update Screen 7: Safety Recommendations with current day's info
    renderSafetyScreen(day, info);
}

// ==================== SCREEN 7: SAFETY SCREEN ====================
function renderSafetyScreen(day, info) {
    const sDate = document.getElementById('safety-date');
    if (sDate) sDate.textContent = `${day.date} • ${selectedLocation}`;

    const sAqi = document.getElementById('safety-aqi-val');
    if (sAqi) { sAqi.textContent = Math.round(day.aqi); sAqi.className = `text-${info.color}`; }

    const sDot = document.getElementById('safety-aqi-dot');
    if (sDot) sDot.className = `dot extra-large bg-${info.color}`;

    const sTxt = document.getElementById('safety-aqi-text');
    if (sTxt) { sTxt.textContent = info.category; sTxt.className = `font-bold text-${info.color}`; }

    const mTitle = document.getElementById('mask-title');
    if (mTitle) { mTitle.textContent = info.mask; mTitle.className = `text-${info.color}`; }

    const mDesc = document.getElementById('mask-desc');
    if (mDesc) mDesc.textContent = info.desc;
}

// ==================== SVG HOURLY AQI GRAPH ====================
function renderHourlyAQIGraph(hourlyAqi) {
    const svg = document.getElementById('aqi-svg-chart');
    const tooltip = document.getElementById('chart-tooltip');
    if (!svg) return;
    svg.innerHTML = '';

    const W = 800, H = 220;
    const pad = { top: 28, right: 35, bottom: 38, left: 42 };
    const maxAqi = Math.max(...hourlyAqi, 220);

    const points = hourlyAqi.map((val, i) => {
        const x = pad.left + (i / (hourlyAqi.length - 1)) * (W - pad.left - pad.right);
        const y = H - pad.bottom - ((val / maxAqi) * (H - pad.top - pad.bottom));
        return { x, y, val, time: TIME_STAMPS[i], info: getAQIInfo(val) };
    });

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF7E00" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#00E400" stop-opacity="0.02"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
    `;
    svg.appendChild(defs);

    // Reference Gridlines
    [50, 100, 150, 200].forEach(lvl => {
        if (lvl > maxAqi) return;
        const yy = H - pad.bottom - ((lvl / maxAqi) * (H - pad.top - pad.bottom));
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        Object.entries({x1: pad.left, y1: yy, x2: W - pad.right, y2: yy, stroke: 'rgba(255,255,255,0.07)', 'stroke-dasharray': '4 4'}).forEach(([k,v]) => line.setAttribute(k, v));
        svg.appendChild(line);
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        Object.entries({x: pad.left - 6, y: yy + 3, fill: '#8E9BAE', 'font-size': '9', 'text-anchor': 'end'}).forEach(([k,v]) => txt.setAttribute(k, v));
        txt.textContent = lvl;
        svg.appendChild(txt);
    });

    // Cubic Bezier Curve
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const cx = (points[i].x + points[i+1].x) / 2;
        pathD += ` C ${cx} ${points[i].y}, ${cx} ${points[i+1].y}, ${points[i+1].x} ${points[i+1].y}`;
    }

    const areaD = `${pathD} L ${points[points.length-1].x} ${H-pad.bottom} L ${points[0].x} ${H-pad.bottom} Z`;
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaD); areaPath.setAttribute('fill', 'url(#aqiFill)');
    svg.appendChild(areaPath);

    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', pathD); linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', '#00E4FF'); linePath.setAttribute('stroke-width', '3');
    linePath.setAttribute('filter', 'url(#glow)');
    svg.appendChild(linePath);

    // Nodes & X-labels
    points.forEach(pt => {
        const xt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        Object.entries({x: pt.x, y: H - 10, fill: '#8E9BAE', 'font-size': '10', 'text-anchor': 'middle'}).forEach(([k,v]) => xt.setAttribute(k, v));
        xt.textContent = pt.time;
        svg.appendChild(xt);

        const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circ.setAttribute('cx', pt.x); circ.setAttribute('cy', pt.y);
        circ.setAttribute('r', '5.5'); circ.setAttribute('fill', pt.info.hex);
        circ.setAttribute('stroke', '#090B10'); circ.setAttribute('stroke-width', '2');
        circ.style.cursor = 'pointer'; circ.style.transition = 'r 0.15s';

        circ.addEventListener('mouseenter', () => {
            circ.setAttribute('r', '8.5');
            if (tooltip) {
                tooltip.innerHTML = `<strong>${pt.time}</strong><br>AQI: <span style="color:${pt.info.hex};font-weight:bold">${pt.val}</span><br><span style="font-size:0.68rem;color:#8E9BAE">${pt.info.category}</span>`;
                tooltip.classList.remove('hidden');
                const rect = svg.getBoundingClientRect();
                tooltip.style.left = `${pt.x * (rect.width / W)}px`;
                tooltip.style.top = `${pt.y * (rect.height / H)}px`;
            }
        });
        circ.addEventListener('mouseleave', () => {
            circ.setAttribute('r', '5.5');
            if (tooltip) tooltip.classList.add('hidden');
        });
        svg.appendChild(circ);
    });
}

// ==================== HOURLY STRIPS ====================
function renderHourlyAQICards(hourlyAqi) {
    const row = document.getElementById('sd-aqi-row');
    if (!row) return;
    row.innerHTML = '';
    hourlyAqi.forEach((val, i) => {
        const info = getAQIInfo(val);
        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <span class="time-lbl">${TIME_STAMPS[i]}</span>
            <span class="dot bg-${info.color}"></span>
            <span class="aqi-val text-${info.color}">${val}</span>
            <span class="cat-lbl text-${info.color}">${info.category}</span>
        `;
        row.appendChild(card);
    });
}

function renderHourlyTempCards(hourlyTemps) {
    const row = document.getElementById('sd-temp-row');
    if (!row) return;
    row.innerHTML = '';
    hourlyTemps.forEach((temp, i) => {
        const icon = temp > 30 ? 'fa-sun text-yellow' : (temp < 26 ? 'fa-moon text-muted' : 'fa-cloud-sun text-orange');
        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <span class="time-lbl">${TIME_STAMPS[i]}</span>
            <i class="fa-solid ${icon} fa-lg mt-small mb-small"></i>
            <span class="temp-val">${temp}°C</span>
        `;
        row.appendChild(card);
    });
}

// ==================== MODAL ====================
function showModal() { const m = document.getElementById('info-modal'); if (m) m.classList.remove('hidden'); }
function hideModal() { const m = document.getElementById('info-modal'); if (m) m.classList.add('hidden'); }
