// Chart configurations and instances
let forecastChartInst = null;
let pollutantChartInst = null;
let inversionChartInst = null;

// Common chart defaults for dark theme
Chart.defaults.color = '#a0a0a0';
Chart.defaults.borderColor = '#2a2a3e';

const aqiBands = [
    { yMin: 0, yMax: 50, backgroundColor: 'rgba(0, 228, 0, 0.1)' },
    { yMin: 50, yMax: 100, backgroundColor: 'rgba(255, 255, 0, 0.1)' },
    { yMin: 100, yMax: 200, backgroundColor: 'rgba(255, 126, 0, 0.1)' },
    { yMin: 200, yMax: 300, backgroundColor: 'rgba(255, 0, 0, 0.1)' },
    { yMin: 300, yMax: 400, backgroundColor: 'rgba(143, 63, 151, 0.1)' },
    { yMin: 400, yMax: 500, backgroundColor: 'rgba(126, 0, 35, 0.1)' }
];

// Custom plugin to draw background bands
const bgBandsPlugin = {
    id: 'bgBands',
    beforeDraw: (chart) => {
        const { ctx, chartArea, scales: { y } } = chart;
        if (!chartArea || !y) return;

        ctx.save();
        aqiBands.forEach(band => {
            const yStart = Math.max(chartArea.top, y.getPixelForValue(band.yMax));
            const yEnd = Math.min(chartArea.bottom, y.getPixelForValue(band.yMin));
            
            if (yEnd > chartArea.top && yStart < chartArea.bottom) {
                ctx.fillStyle = band.backgroundColor;
                ctx.fillRect(chartArea.left, yStart, chartArea.right - chartArea.left, yEnd - yStart);
            }
        });
        ctx.restore();
    }
};

function initForecastChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    forecastChartInst = new Chart(ctx, {
        type: 'line',
        plugins: [bgBandsPlugin],
        data: {
            labels: [],
            datasets: [
                {
                    label: 'AI-Calibrated Forecast',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    zIndex: 10
                },
                {
                    label: 'Raw WRF-Chem',
                    data: [],
                    borderColor: '#888',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'p90',
                    data: [],
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: '+1', // Fill to next dataset
                    pointRadius: 0
                },
                {
                    label: 'p10',
                    data: [],
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    min: 0,
                    max: 500,
                    title: { display: true, text: 'AQI' }
                },
                x: {
                    ticks: {
                        callback: function(val, index) {
                            return index % 6 === 0 ? this.getLabelForValue(val) : '';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        filter: function(item, chart) {
                            // Hide p10/p90 from legend
                            return !item.text.includes('p10') && !item.text.includes('p90');
                        }
                    }
                }
            }
        }
    });
}

function updateForecastChart(data) {
    if (!forecastChartInst) return;

    const labels = data.hours.map(d => {
        const date = new Date(d.timestamp);
        return `${date.getHours()}:00`;
    });

    forecastChartInst.data.labels = labels;
    forecastChartInst.data.datasets[0].data = data.hours.map(d => d.calibrated);
    forecastChartInst.data.datasets[1].data = data.hours.map(d => d.raw);
    forecastChartInst.data.datasets[2].data = data.hours.map(d => d.p90);
    forecastChartInst.data.datasets[3].data = data.hours.map(d => d.p10);

    forecastChartInst.update();
}

function initPollutantChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    pollutantChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'PM2.5',
                    data: [],
                    borderColor: '#ff0000',
                    backgroundColor: 'rgba(255, 0, 0, 0.5)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'PM10',
                    data: [],
                    borderColor: '#ff7e00',
                    backgroundColor: 'rgba(255, 126, 0, 0.5)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'O3',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.5)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'NOx',
                    data: [],
                    borderColor: '#ffff00',
                    backgroundColor: 'rgba(255, 255, 0, 0.5)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    stacked: true,
                    title: { display: true, text: 'Concentration' }
                },
                x: {
                    ticks: {
                        callback: function(val, index) {
                            return index % 6 === 0 ? this.getLabelForValue(val) : '';
                        }
                    }
                }
            }
        }
    });
}

function updatePollutantChart(data) {
    if (!pollutantChartInst) return;

    const labels = data.hours.map(d => {
        const date = new Date(d.timestamp);
        return `${date.getHours()}:00`;
    });

    pollutantChartInst.data.labels = labels;
    pollutantChartInst.data.datasets[0].data = data.hours.map(d => d.pm25);
    pollutantChartInst.data.datasets[1].data = data.hours.map(d => d.pm10);
    pollutantChartInst.data.datasets[2].data = data.hours.map(d => d.o3);
    pollutantChartInst.data.datasets[3].data = data.hours.map(d => d.nox);

    pollutantChartInst.update();
}

function initInversionChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    inversionChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Inversion Strength (°C)',
                    data: [],
                    borderColor: '#ff7e00',
                    backgroundColor: 'rgba(255, 126, 0, 0.2)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'PBL Height (m)',
                    data: [],
                    borderColor: '#00d4ff',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Strength (°C)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'PBL Height (m)' },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: {
                        callback: function(val, index) {
                            return index % 6 === 0 ? this.getLabelForValue(val) : '';
                        }
                    }
                }
            }
        }
    });
}

function updateInversionTimeline(timelineData) {
    if (!inversionChartInst) return;

    const labels = timelineData.map(d => `+${d.hour}h`);
    
    inversionChartInst.data.labels = labels;
    inversionChartInst.data.datasets[0].data = timelineData.map(d => d.strength);
    inversionChartInst.data.datasets[1].data = timelineData.map(d => d.pblHeight);
    
    inversionChartInst.update();
}

window.chartUtils = {
    initForecastChart,
    updateForecastChart,
    initPollutantChart,
    updatePollutantChart,
    initInversionChart,
    updateInversionTimeline
};
