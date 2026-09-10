function updateInversionGauge(strength) {
    const gauge = document.getElementById('inversion-gauge');
    const valText = document.getElementById('gauge-val');
    
    // Cap at 10 for percentage calc
    const cappedStrength = Math.min(Math.max(strength, 0), 10);
    const percentage = (cappedStrength / 10) * 100;
    
    let color = '#00e400'; // Green
    if (strength > 2) color = '#ffff00'; // Yellow
    if (strength > 5) color = '#ff7e00'; // Orange
    if (strength > 8) color = '#ff0000'; // Red
    
    gauge.style.background = `conic-gradient(${color} ${percentage}%, var(--bg-main) ${percentage}%)`;
    valText.innerText = strength.toFixed(1);
    valText.style.color = color;
}

function updateInversionProfile(profileData) {
    const canvas = document.getElementById('profile-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Axes
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, h - 20); // Y axis (Altitude)
    ctx.lineTo(w - 10, h - 20); // X axis (Temp)
    ctx.stroke();
    
    ctx.fillStyle = '#888';
    ctx.font = '10px Arial';
    ctx.fillText('Alt(m)', 2, 10);
    ctx.fillText('Temp(°C)', w - 40, h - 5);
    
    // Plot data
    if (!profileData || profileData.length === 0) return;
    
    const maxAlt = 2000;
    const minTemp = Math.min(...profileData.map(d => d.temp)) - 5;
    const maxTemp = Math.max(...profileData.map(d => d.temp)) + 5;
    
    const getX = (temp) => 30 + ((temp - minTemp) / (maxTemp - minTemp)) * (w - 40);
    const getY = (alt) => (h - 20) - ((alt / maxAlt) * (h - 30));
    
    ctx.beginPath();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    let prevPoint = null;
    let inversionStart = null;
    let inversionEnd = null;
    
    profileData.forEach((point, i) => {
        const x = getX(point.temp);
        const y = getY(point.alt);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
            
            // Check for inversion (temp increases with altitude)
            if (point.temp > prevPoint.temp) {
                if (!inversionStart) inversionStart = prevPoint;
                inversionEnd = point;
            }
        }
        prevPoint = point;
    });
    ctx.stroke();
    
    // Highlight Inversion Layer
    if (inversionStart && inversionEnd) {
        const y1 = getY(inversionStart.alt);
        const y2 = getY(inversionEnd.alt);
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(30, y2, w - 40, y1 - y2);
        
        ctx.fillStyle = '#ff7e00';
        ctx.fillText('Inversion Layer', 35, y2 + (y1-y2)/2 + 4);
    }
}

window.inversionUtils = {
    updateInversionGauge,
    updateInversionProfile
};
