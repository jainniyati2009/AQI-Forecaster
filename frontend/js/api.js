const API_BASE = window.location.origin + '/api';

/**
 * Fetch with retry logic and error handling
 */
async function fetchJSON(endpoint, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            // Using placeholder mock data logic to ensure frontend works without real backend
            // In production, uncomment the fetch call
            // const response = await fetch(`${API_BASE}${endpoint}`);
            // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            // return await response.json();
            
            return await mockApiCall(endpoint);
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed for ${endpoint}:`, error);
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, backoff * (i + 1)));
        }
    }
}

// -------------------------------------------------------------
// MOCK API LAYER FOR FRONTEND DEVELOPMENT
// -------------------------------------------------------------
async function mockApiCall(endpoint) {
    await new Promise(res => setTimeout(res, 500)); // Simulate network latency

    if (endpoint === '/current') {
        return {
            aqi: Math.floor(Math.random() * 200) + 100, // 100 to 300
            timestamp: new Date().toISOString()
        };
    }
    
    if (endpoint === '/stations') {
        return [
            { id: 'dl-1', name: 'Anand Vihar', lat: 28.6469, lng: 77.3160, aqi: 350, pm25: 180, temp: 22, windDir: 45, windSpeed: 5 },
            { id: 'dl-2', name: 'RK Puram', lat: 28.5632, lng: 77.1869, aqi: 220, pm25: 95, temp: 23, windDir: 60, windSpeed: 4 },
            { id: 'dl-3', name: 'Punjabi Bagh', lat: 28.6619, lng: 77.1241, aqi: 280, pm25: 130, temp: 21, windDir: 40, windSpeed: 6 },
            { id: 'dl-4', name: 'ITO', lat: 28.6284, lng: 77.2405, aqi: 310, pm25: 150, temp: 22, windDir: 50, windSpeed: 4 },
            { id: 'dl-5', name: 'Dwarka Sector 8', lat: 28.5710, lng: 77.0719, aqi: 190, pm25: 80, temp: 24, windDir: 70, windSpeed: 8 }
        ];
    }
    
    if (endpoint.startsWith('/forecast')) {
        const hours = 72;
        const data = [];
        let baseAqi = 200;
        for (let i = 0; i < hours; i++) {
            const time = new Date();
            time.setHours(time.getHours() + i);
            baseAqi = baseAqi + (Math.sin(i / 4) * 20) + (Math.random() * 10 - 5);
            
            data.push({
                timestamp: time.toISOString(),
                raw: Math.max(50, baseAqi * 1.1),
                calibrated: Math.max(50, baseAqi),
                p10: Math.max(40, baseAqi * 0.8),
                p90: Math.max(60, baseAqi * 1.2),
                pm25: baseAqi * 0.4,
                pm10: baseAqi * 0.3,
                o3: baseAqi * 0.2,
                nox: baseAqi * 0.1
            });
        }
        return { hours: data };
    }
    
    if (endpoint === '/inversion') {
        const data = [];
        for (let i = 0; i < 72; i++) {
            const strength = Math.abs(Math.sin(i / 12) * 8) + Math.random() * 2;
            data.push({
                hour: i,
                strength: strength,
                pblHeight: Math.max(100, 1500 - (strength * 100))
            });
        }
        return {
            currentStrength: data[0].strength,
            profile: [
                { alt: 0, temp: 20 },
                { alt: 200, temp: 18 },
                { alt: 400, temp: 22 }, // Inversion here
                { alt: 600, temp: 16 },
                { alt: 1000, temp: 12 },
                { alt: 2000, temp: 5 }
            ],
            timeline: data
        };
    }
    
    if (endpoint === '/stubble') {
        return {
            active: true,
            season: 'Post-Monsoon',
            intensity: 75, // 0-100
            contributionPct: 22,
            windDir: 315 // NW
        };
    }
    
    if (endpoint.startsWith('/health/')) {
        const aqi = parseInt(endpoint.split('/')[2]);
        let cat, color, mask, adv;
        if (aqi <= 50) { cat="Good"; color="#00e400"; mask="Not Required"; adv="Air quality is considered satisfactory."; }
        else if (aqi <= 100) { cat="Satisfactory"; color="#ffff00"; mask="Not Required"; adv="Air quality is acceptable."; }
        else if (aqi <= 200) { cat="Moderate"; color="#ff7e00"; mask="N95 Optional"; adv="Unusually sensitive people should consider reducing prolonged outdoor exertion."; }
        else if (aqi <= 300) { cat="Poor"; color="#ff0000"; mask="N95 Recommended"; adv="Children, active adults, and people with respiratory disease should avoid prolonged outdoor exertion."; }
        else if (aqi <= 400) { cat="Very Poor"; color="#8f3f97"; mask="N95 Required"; adv="Active children and adults, and people with respiratory disease should avoid all outdoor exertion."; }
        else { cat="Severe"; color="#7e0023"; mask="N95/P100 Required"; adv="Health alert: everyone may experience more serious health effects. Avoid all outdoor physical activities."; }
        
        return { category: cat, color: color, mask: mask, advisory: adv };
    }

    if (endpoint.startsWith('/heatmap')) {
         // Generate random heatmap points around Delhi
         const points = [];
         for(let i=0; i<50; i++){
             points.push([
                 28.6139 + (Math.random() - 0.5) * 0.5,
                 77.2090 + (Math.random() - 0.5) * 0.5,
                 Math.random() // intensity
             ]);
         }
         return points;
    }

    throw new Error('Not found');
}

// -------------------------------------------------------------
// EXPORTS
// -------------------------------------------------------------
const api = {
    getForecasts: () => fetchJSON('/forecast'),
    getStationForecast: (id) => fetchJSON(`/forecast/${id}`),
    getCurrentAQI: () => fetchJSON('/current'),
    getInversion: () => fetchJSON('/inversion'),
    getStubbleStatus: () => fetchJSON('/stubble'),
    getHealthAdvisory: (aqi) => fetchJSON(`/health/${aqi}`),
    getStations: () => fetchJSON('/stations'),
    getHeatmap: (hour) => fetchJSON(`/heatmap?hour=${hour}`)
};

window.api = api;
