const aqiRanges = [
    { cat: 'Good', range: '0-50', color: '#00e400', mask: 'Not Required', text: 'Air quality is considered satisfactory, and air pollution poses little or no risk.' },
    { cat: 'Satisfactory', range: '51-100', color: '#ffff00', mask: 'Not Required', text: 'Air quality is acceptable; however, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.' },
    { cat: 'Moderate', range: '101-200', color: '#ff7e00', mask: 'N95 Optional', text: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.' },
    { cat: 'Poor', range: '201-300', color: '#ff0000', mask: 'N95 Recommended', text: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.' },
    { cat: 'Very Poor', range: '301-400', color: '#8f3f97', mask: 'N95 Required', text: 'Health alert: The risk of health effects is increased for everyone.' },
    { cat: 'Severe', range: '401-500', color: '#7e0023', mask: 'N95/P100 Required', text: 'Health warning of emergency conditions: everyone is more likely to be affected.' }
];

async function updateHealthAdvisory(aqi) {
    const card = document.getElementById('health-advisory-card');
    const aqiVal = document.getElementById('health-aqi-value');
    const catLabel = document.getElementById('health-aqi-cat');
    const maskText = document.getElementById('health-mask-text');
    const advText = document.getElementById('health-adv-text');

    try {
        const healthData = await window.api.getHealthAdvisory(aqi);
        
        // Update DOM
        animateValue(aqiVal, parseInt(aqiVal.innerText) || 0, aqi, 1000);
        catLabel.innerText = healthData.category;
        maskText.innerText = healthData.mask;
        advText.innerText = healthData.advisory;

        // Update card styles
        card.style.borderColor = healthData.color;
        const rgbaColor = hexToRgba(healthData.color, 0.2);
        card.querySelector('.health-content').style.background = `linear-gradient(135deg, ${rgbaColor} 0%, rgba(0,0,0,0) 100%)`;
        catLabel.style.color = healthData.color;

    } catch (e) {
        console.error("Failed to load health advisory", e);
    }
}

function renderAQITable() {
    const container = document.getElementById('aqi-reference-table');
    container.innerHTML = '';

    aqiRanges.forEach(range => {
        const item = document.createElement('div');
        item.className = 'aqi-ref-item';
        item.style.backgroundColor = range.color;
        
        // Adjust text color for contrast
        const isDark = ['#ff0000', '#8f3f97', '#7e0023'].includes(range.color);
        item.style.color = isDark ? '#fff' : '#000';

        item.innerHTML = `
            <div>${range.cat}</div>
            <div style="font-size: 0.65rem;">${range.range}</div>
        `;
        item.title = `${range.mask} - ${range.text}`;
        container.appendChild(item);
    });
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

window.healthUtils = {
    updateHealthAdvisory,
    renderAQITable
};
