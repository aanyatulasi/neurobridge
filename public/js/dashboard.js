document.addEventListener('DOMContentLoaded', () => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) {
        showError('No session ID provided');
        return;
    }

    // Initialize charts
    initEmpathyChart();
    initEmotionTimeline();

    // Fetch dashboard data
    fetchDashboardData(sessionId);
});

async function fetchDashboardData(sessionId) {
    try {
        showLoading(true);
        const response = await fetch(`/api/dashboard/${sessionId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            updateDashboard(data.data);
            animateElements();
        } else {
            throw new Error(data.error || 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError(error.message || 'Failed to load dashboard. Please try again.');
    } finally {
        showLoading(false);
    }
}

function updateDashboard(data) {
    // Update session info
    document.getElementById('session-id').textContent = data.session_id;
    
    // Update empathy score
    updateEmpathyScore(data.emotion_summary.average_empathy);
    
    // Update emotion distribution
    updateEmotionDistribution(data.emotion_summary.emotion_distribution);
    
    // Update timeline
    updateEmotionTimeline(data.emotion_summary.timeline);
    
    // Update session summary
    updateSessionSummary(data.emotion_summary);
}

function updateEmpathyScore(score) {
    const scoreElement = document.getElementById('empathy-score');
    const percentage = Math.round(score * 100);
    scoreElement.textContent = `${percentage}%`;
    
    // Update progress circle
    const circle = document.querySelector('.progress-circle-progress');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
    
    // Update color based on score
    if (percentage >= 70) {
        circle.style.stroke = '#4CAF50'; // Green
    } else if (percentage >= 40) {
        circle.style.stroke = '#FFC107'; // Yellow
    } else {
        circle.style.stroke = '#F44336'; // Red
    }
}

function updateEmotionDistribution(distribution) {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.emotionChart) {
        window.emotionChart.destroy();
    }
    
    const labels = Object.keys(distribution);
    const data = Object.values(distribution);
    
    window.emotionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Emotion Frequency',
                data: data,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} occurrences`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function initEmotionTimeline() {
    // Initialize empty timeline chart
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    window.timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Emotion Timeline',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Emotion Intensity'
                    },
                    min: 0,
                    max: 1
                }
            }
        }
    });
}

function updateEmotionTimeline(timeline) {
    if (!timeline || !timeline.emotions || !Array.isArray(timeline.emotions)) {
        console.warn('Invalid timeline data:', timeline);
        return;
    }

    // Process timeline data
    const labels = [];
    const data = [];
    
    timeline.emotions.forEach((emotion, index) => {
        const time = new Date(emotion.timestamp || Date.now() - (timeline.emotions.length - index) * 60000);
        labels.push(time.toLocaleTimeString());
        data.push({
            x: time,
            y: emotion.confidence || 0,
            emotion: emotion.emotion || 'neutral'
        });
    });

    // Update chart
    window.timelineChart.data.labels = labels;
    window.timelineChart.data.datasets[0].data = data;
    window.timelineChart.update();
}

function updateSessionSummary(summary) {
    const summaryElement = document.getElementById('session-summary');
    
    if (!summary.emotion_distribution) {
        summaryElement.innerHTML = '<p>No summary data available</p>';
        return;
    }
    
    // Sort emotions by frequency
    const sortedEmotions = Object.entries(summary.emotion_distribution)
        .sort((a, b) => b[1] - a[1]);
    
    // Get top 3 emotions
    const topEmotions = sortedEmotions.slice(0, 3);
    const totalEmotions = Object.values(summary.emotion_distribution)
        .reduce((sum, count) => sum + count, 0);
    
    // Generate summary text
    let summaryHTML = '<div class="summary-item">';
    
    topEmotions.forEach(([emotion, count]) => {
        const percentage = Math.round((count / totalEmotions) * 100);
        summaryHTML += `
            <div class="emotion-bar">
                <span class="emotion-label">${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentage}%;"></div>
                </div>
                <span class="percentage">${percentage}%</span>
            </div>
        `;
    });
    
    summaryHTML += '</div>';
    summaryElement.innerHTML = summaryHTML;
}

function animateElements() {
    const elements = document.querySelectorAll('.card, .summary-item');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`;
        
        // Trigger reflow
        void element.offsetWidth;
        
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    });
}

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    console.error(message);
}

// Initialize charts on window load
window.addEventListener('load', () => {
    // Register custom easing function
    Chart.helpers.easing.easeInOutQuart = function(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    };
});
