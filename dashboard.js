class Dashboard {
    constructor() {
        this.dashboardModal = document.getElementById('dashboard-modal');
        this.dashboardContent = document.getElementById('dashboard-content');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle dashboard modal
        document.getElementById('view-dashboard')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showDashboard();
        });

        // Close dashboard when clicking the close button
        document.getElementById('close-dashboard')?.addEventListener('click', () => {
            this.hideDashboard();
        });

        // Close dashboard when clicking outside the modal
        this.dashboardModal?.addEventListener('click', (e) => {
            if (e.target === this.dashboardModal) {
                this.hideDashboard();
            }
        });
    }

    showDashboard() {
        if (!this.dashboardModal) return;
        
        // Show loading state
        this.dashboardContent.innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <span class="ml-4 text-gray-600">Generating insights...</span>
            </div>
        `;
        
        // Show modal
        this.dashboardModal.classList.remove('hidden');
        
        // Generate dashboard content after a short delay to allow for animation
        setTimeout(() => this.generateDashboardContent(), 300);
    }

    hideDashboard() {
        if (this.dashboardModal) {
            this.dashboardModal.classList.add('hidden');
        }
    }

    async generateDashboardContent() {
        try {
            // Get data from empathy assistant
            const analysis = window.empathyAssistant?.getConversationAnalysis() || {};
            
            // Generate HTML for the dashboard
            this.dashboardContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Emotion Distribution Card -->
                    <div class="metric-card">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Emotion Distribution</h3>
                        <div class="h-48">
                            <canvas id="emotionChart"></canvas>
                        </div>
                    </div>

                    <!-- Conversation Overview -->
                    <div class="metric-card">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Conversation Overview</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Messages:</span>
                                <span class="font-medium">${analysis.totalMessages || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Dominant Emotion:</span>
                                <span class="font-medium capitalize">${analysis.dominantEmotion || 'Neutral'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Sentiment Trend:</span>
                                <span class="font-medium">
                                    ${this.getTrendIcon(analysis.sentimentTrend || 'stable')}
                                    ${this.formatSentimentTrend(analysis.sentimentTrend || 'stable')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Key Topics -->
                    <div class="metric-card">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Key Topics</h3>
                        <div class="flex flex-wrap gap-2">
                            ${this.renderTopics(analysis.conversationTopics || [])}
                        </div>
                    </div>

                    <!-- Emotion Timeline -->
                    <div class="metric-card md:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Emotion Timeline</h3>
                        <div class="h-64">
                            <canvas id="timelineChart"></canvas>
                        </div>
                    </div>

                    <!-- Suggestions -->
                    <div class="metric-card">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Insights & Suggestions</h3>
                        <div class="space-y-3 text-sm">
                            ${this.generateInsights(analysis)}
                        </div>
                    </div>
                </div>
            `;

            // Render charts
            this.renderEmotionChart(analysis.emotionDistribution || {});
            this.renderTimelineChart();
            
        } catch (error) {
            console.error('Error generating dashboard:', error);
            this.dashboardContent.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
                    <p class="text-gray-600">We encountered an error while generating your dashboard. Please try again later.</p>
                    <button onclick="window.dashboard.showDashboard()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    renderTopics(topics) {
        if (!topics || topics.length === 0) {
            return '<div class="text-gray-500 italic">No topics detected yet</div>';
        }
        
        const colors = ['bg-indigo-100 text-indigo-800', 'bg-purple-100 text-purple-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800'];
        
        return topics.map((topic, index) => {
            const colorClass = colors[index % colors.length];
            return `<span class="px-3 py-1 rounded-full text-xs font-medium ${colorClass}">${topic}</span>`;
        }).join('');
    }

    generateInsights(analysis) {
        const insights = [];
        
        // Emotion-based insights
        if (analysis.dominantEmotion === 'happy') {
            insights.push('Your conversation has been mostly positive! Keep up the good energy!');
        } else if (analysis.dominantEmotion === 'sad') {
            insights.push('I noticed some sadness in the conversation. Would you like to talk about what\'s on your mind?');
        } else if (analysis.dominantEmotion === 'angry') {
            insights.push('I sense some frustration. Remember to take deep breaths and approach things calmly.');
        }
        
        // Sentiment trend insights
        if (analysis.sentimentTrend === 'improving') {
            insights.push('The conversation has been getting more positive over time.');
        } else if (analysis.sentimentTrend === 'declining') {
            insights.push('The conversation has taken a more negative turn recently.');
        }
        
        // General tips
        insights.push('Try to maintain a balance between speaking and listening for better conversations.');
        insights.push('Remember to take breaks during long conversations to reflect.');
        
        return insights.map(insight => 
            `<div class="flex items-start">
                <div class="flex-shrink-0 h-5 w-5 text-indigo-500">💡</div>
                <p class="ml-2 text-gray-700">${insight}</p>
            </div>`
        ).join('');
    }

    renderEmotionChart(emotionData) {
        const ctx = document.getElementById('emotionChart');
        if (!ctx) return;
        
        const labels = Object.keys(emotionData);
        const data = Object.values(emotionData);
        
        // Define colors for each emotion
        const backgroundColors = {
            'happy': 'rgba(255, 193, 7, 0.7)',
            'sad': 'rgba(33, 150, 243, 0.7)',
            'angry': 'rgba(244, 67, 54, 0.7)',
            'neutral': 'rgba(158, 158, 158, 0.7)',
            'surprised': 'rgba(233, 30, 99, 0.7)',
            'fearful': 'rgba(156, 39, 176, 0.7)',
            'disgusted': 'rgba(76, 175, 80, 0.7)'
        };
        
        const backgroundColor = labels.map(emotion => backgroundColors[emotion] || '#cccccc');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(emotion => this.capitalizeFirstLetter(emotion)),
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        
        // Get emotion history from the detector
        const emotionHistory = window.emotionDetector?.getEmotionHistory() || [];
        
        if (emotionHistory.length === 0) {
            ctx.parentElement.innerHTML = '<p class="text-gray-500 text-center py-8">Not enough data to show timeline</p>';
            return;
        }
        
        // Group emotions by time intervals (e.g., every 5 entries)
        const interval = Math.max(1, Math.floor(emotionHistory.length / 10));
        const labels = [];
        const emotionData = {
            happy: [],
            sad: [],
            angry: [],
            neutral: [],
            surprised: []
        };
        
        for (let i = 0; i < emotionHistory.length; i += interval) {
            const chunk = emotionHistory.slice(i, i + interval);
            const emotionCounts = {};
            
            // Count emotions in this chunk
            chunk.forEach(entry => {
                emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
            });
            
            // Add data points for each emotion
            Object.keys(emotionData).forEach(emotion => {
                const count = emotionCounts[emotion] || 0;
                const percentage = (count / chunk.length) * 100;
                emotionData[emotion].push(percentage);
            });
            
            // Add label (time or sequence number)
            labels.push(`T${i+1}-${Math.min(i+interval, emotionHistory.length)}`);
        }
        
        // Create dataset for each emotion
        const datasets = Object.entries(emotionData).map(([emotion, data]) => ({
            label: this.capitalizeFirstLetter(emotion),
            data: data,
            borderColor: this.getEmotionColor(emotion),
            backgroundColor: this.addAlpha(this.getEmotionColor(emotion), 0.1),
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
            fill: true
        }));
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Intervals'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Math.round(context.raw)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Helper functions
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    getEmotionColor(emotion) {
        const colors = {
            'happy': '#FFC107',
            'sad': '#2196F3',
            'angry': '#F44336',
            'neutral': '#9E9E9E',
            'surprised': '#E91E63',
            'fearful': '#9C27B0',
            'disgusted': '#4CAF50'
        };
        return colors[emotion] || '#000000';
    }

    addAlpha(color, opacity) {
        // Add alpha channel to hex color
        const _opacity = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);
        return color + _opacity.toString(16).toUpperCase();
    }

    getTrendIcon(trend) {
        const icons = {
            'improving': '📈',
            'declining': '📉',
            'stable': '➡️'
        };
        return icons[trend] || '';
    }

    formatSentimentTrend(trend) {
        const labels = {
            'improving': 'Improving',
            'declining': 'Declining',
            'stable': 'Stable'
        };
        return labels[trend] || 'Unknown';
    }
}

// Initialize dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
