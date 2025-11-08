// app.js - Main application logic for NeuroBridge

// Global variables
let videoStream = null;
let audioStream = null;
let emotionUpdateInterval = null;
let currentEmotion = 'neutral';
let emotionHistory = [];
const MAX_HISTORY = 50; // Number of emotion data points to keep

// DOM Elements
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const emotionDisplay = document.getElementById('emotion-display');
const startVideoBtn = document.getElementById('startVideo');
const startAudioBtn = document.getElementById('startAudio');

// Cultural Tone Packs
const tonePacks = {
    'indian': {
        name: 'Indian English',
        modifiers: {
            happy: 'That sounds wonderful!',
            sad: 'I can understand this is difficult for you.',
            angry: 'I can see you\'re upset. Let\'s take a moment.',
            surprised: 'Oh! That\'s quite unexpected!',
            fearful: 'I can sense some concern. Would you like to talk about it?',
            disgusted: 'I understand this might not be pleasant.',
            neutral: 'I see. Please continue.'
        }
    },
    'american': {
        name: 'American English',
        modifiers: {
            happy: 'That\'s awesome!',
            sad: 'I\'m really sorry to hear that.',
            angry: 'I can see you\'re frustrated.',
            surprised: 'Wow, that\'s surprising!',
            fearful: 'That sounds really concerning.',
            disgusted: 'That doesn\'t sound good at all.',
            neutral: 'I understand.'
        }
    },
    'british': {
        name: 'British English',
        modifiers: {
            happy: 'Brilliant!',
            sad: 'I\'m terribly sorry to hear that.',
            angry: 'I can see you\'re rather cross about this.',
            surprised: 'Blimey! That\'s unexpected!',
            fearful: 'That does sound rather concerning.',
            disgusted: 'How dreadful!',
            neutral: 'Right then.'
        }
    }
};

let currentTone = 'american'; // Default tone

// Initialize the application
function init() {
    setupEventListeners();
    createToneSelector();
    initializeEmotionTimeline();
}

// Set up event listeners
function setupEventListeners() {
    // Video and audio controls
    if (startVideoBtn) {
        startVideoBtn.addEventListener('click', toggleVideo);
    }
    if (startAudioBtn) {
        startAudioBtn.addEventListener('click', toggleAudio);
    }
    
    // View mode toggles
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case '1':
                    setViewMode('chat');
                    break;
                case '2':
                    setViewMode('video');
                    break;
                case '3':
                    setViewMode('voice');
                    break;
            }
        }
    });
}

// Toggle video stream
async function toggleVideo() {
    if (videoStream) {
        stopVideoStream();
    } else {
        try {
            videoStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            videoElement.srcObject = videoStream;
            startVideoBtn.innerHTML = '<i class="fas fa-video-slash mr-2"></i>Stop Video';
            startVideoBtn.classList.remove('bg-indigo-600');
            startVideoBtn.classList.add('bg-red-600');
            startVideoBtn.classList.remove('hover:bg-indigo-700');
            startVideoBtn.classList.add('hover:bg-red-700');
            
            // Start emotion detection
            startEmotionDetection();
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access the camera. Please check permissions.');
        }
    }
}

// Toggle audio stream
async function toggleAudio() {
    if (audioStream) {
        stopAudioStream();
    } else {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            startAudioBtn.innerHTML = '<i class="fas fa-microphone-slash mr-2"></i>Mute';
            startAudioBtn.classList.remove('bg-green-600');
            startAudioBtn.classList.add('bg-red-600');
            startAudioBtn.classList.remove('hover:bg-green-700');
            startAudioBtn.classList.add('hover:bg-red-700');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access the microphone. Please check permissions.');
        }
    }
}

// Stop video stream
function stopVideoStream() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
        videoElement.srcObject = null;
        startVideoBtn.innerHTML = '<i class="fas fa-video mr-2"></i>Start Video';
        startVideoBtn.classList.remove('bg-red-600');
        startVideoBtn.classList.add('bg-indigo-600');
        startVideoBtn.classList.remove('hover:bg-red-700');
        startVideoBtn.classList.add('hover:bg-indigo-700');
        
        // Stop emotion detection
        stopEmotionDetection();
    }
}

// Stop audio stream
function stopAudioStream() {
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
        startAudioBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i>Start Voice';
        startAudioBtn.classList.remove('bg-red-600');
        startAudioBtn.classList.add('bg-green-600');
        startAudioBtn.classList.remove('hover:bg-red-700');
        startAudioBtn.classList.add('hover:bg-green-700');
    }
}

// Start emotion detection
function startEmotionDetection() {
    // Clear any existing interval
    stopEmotionDetection();
    
    // Start new detection interval (every 2 seconds)
    emotionUpdateInterval = setInterval(() => {
        if (videoStream) {
            // In a real implementation, this would call your emotion detection model
            // For now, we'll simulate it with a random emotion
            const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            updateEmotionDisplay(randomEmotion);
        }
    }, 2000);
}

// Stop emotion detection
function stopEmotionDetection() {
    if (emotionUpdateInterval) {
        clearInterval(emotionUpdateInterval);
        emotionUpdateInterval = null;
    }
}

// Update background based on emotion
function updateBackgroundForEmotion(emotion) {
    const root = document.documentElement;
    
    // Define gradient colors for each emotion
    const emotionGradients = {
        'happy': { start: '#4f46e5', end: '#7c3aed' },      // Purple to violet
        'sad': { start: '#3b82f6', end: '#60a5fa' },        // Blue to light blue
        'angry': { start: '#ef4444', end: '#f87171' },      // Red to light red
        'surprised': { start: '#f59e0b', end: '#fbbf24' },  // Yellow to light yellow
        'fearful': { start: '#8b5cf6', end: '#c4b5fd' },    // Indigo to light indigo
        'disgusted': { start: '#10b981', end: '#34d399' },  // Green to light green
        'neutral': { start: '#4b5563', end: '#6b7280' },    // Gray to light gray
        'calm': { start: '#3b82f6', end: '#60a5fa' }        // Blue to light blue
    };
    
    // Default to neutral if emotion not found
    const { start = '#4b5563', end = '#6b7280' } = emotionGradients[emotion] || emotionGradients['neutral'];
    
    // Update CSS variables
    root.style.setProperty('--bg-gradient-start', start);
    root.style.setProperty('--bg-gradient-end', end);
}

// Update emotion display with tooltip
function updateEmotionDisplay(emotion) {
    currentEmotion = emotion;
    updateBackgroundForEmotion(emotion);
    
    const emotionIcons = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        surprised: '😲',
        fearful: '😨',
        disgusted: '🤢',
        neutral: '😐'
    };
    
    const emotionText = {
        happy: 'You seem happy!',
        sad: 'You seem a bit down.',
        angry: 'You seem frustrated.',
        surprised: 'You seem surprised!',
        fearful: 'You seem concerned.',
        disgusted: 'You seem displeased.',
        neutral: 'Neutral expression.'
    };
    
    const suggestionText = {
        happy: 'Keep the positive energy going!',
        sad: 'Would you like to talk about what\'s bothering you?',
        angry: 'Take a deep breath. Would you like to discuss this calmly?',
        surprised: 'That was unexpected, wasn\'t it?',
        fearful: 'It\'s okay to feel this way. Would you like to talk about it?',
        disgusted: 'I can see this isn\'t sitting well with you.',
        neutral: 'How are you feeling right now?'
    };
    
    // Update emotion display with tooltip
    if (emotionDisplay) {
        emotionDisplay.innerHTML = `
            <div class="inline-flex items-center" 
                 data-tooltip="${emotionText[emotion]} ${suggestionText[emotion]}"
                 data-tooltip-position="top">
                <span class="text-3xl mr-2">${emotionIcons[emotion]}</span>
                <span class="text-gray-700">${emotionText[emotion]}</span>
            </div>
        `;
    }
    
    // Add to emotion history for timeline
    updateEmotionTimeline(emotion);
    
    // Show suggestion if enabled
    showSuggestion(emotion);
}

// Show suggestion based on emotion
function showSuggestion(emotion) {
    const suggestionList = document.getElementById('suggestion-list');
    const suggestionsContainer = document.getElementById('suggestions');
    
    if (!suggestionList || !suggestionsContainer) return;
    
    // Clear previous suggestions
    suggestionList.innerHTML = '';
    
    // Get tone-appropriate suggestion
    const tonePack = tonePacks[currentTone];
    const suggestion = tonePack.modifiers[emotion];
    
    if (suggestion) {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'bg-white p-3 rounded-lg shadow text-sm';
        suggestionElement.textContent = suggestion;
        suggestionList.appendChild(suggestionElement);
        suggestionsContainer.classList.remove('hidden');
    } else {
        suggestionsContainer.classList.add('hidden');
    }
}

// Create tone selector dropdown
function createToneSelector() {
    const chatHeader = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-6 h2');
    if (!chatHeader) return;
    
    const container = document.createElement('div');
    container.className = 'mb-4';
    
    const label = document.createElement('label');
    label.className = 'block text-sm font-medium text-gray-700 mb-1';
    label.textContent = 'Cultural Tone:';
    
    const select = document.createElement('select');
    select.id = 'tone-selector';
    select.className = 'block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md';
    
    // Add tone options
    Object.entries(tonePacks).forEach(([key, pack]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = pack.name;
        if (key === currentTone) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Add change event listener
    select.addEventListener('change', (e) => {
        currentTone = e.target.value;
        // Update any displayed suggestions with the new tone
        if (currentEmotion) {
            showSuggestion(currentEmotion);
        }
    });
    
    container.appendChild(label);
    container.appendChild(select);
    
    // Insert after the chat header
    chatHeader.parentNode.insertBefore(container, chatHeader.nextSibling);
}

// Set view mode (chat/video/voice)
function setViewMode(mode) {
    const videoContainer = document.querySelector('.video-container');
    const chatContainer = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-6');
    
    if (!videoContainer || !chatContainer) return;
    
    switch(mode) {
        case 'chat':
            videoContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            break;
        case 'video':
            videoContainer.classList.remove('hidden');
            chatContainer.classList.remove('hidden');
            break;
        case 'voice':
            videoContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            break;
    }
}

// Initialize emotion timeline
function initializeEmotionTimeline() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;
    
    // Add timeline section to dashboard
    const timelineSection = document.createElement('div');
    timelineSection.className = 'mb-8';
    timelineSection.innerHTML = `
        <h3 class="text-lg font-medium text-gray-900 mb-4">Emotion Timeline</h3>
        <canvas id="emotion-timeline" height="200"></canvas>
    `;
    dashboardContent.appendChild(timelineSection);
    
    // Initialize chart with empty data
    const ctx = document.getElementById('emotion-timeline').getContext('2d');
    window.emotionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Emotion Intensity',
                data: [],
                borderColor: 'rgb(99, 102, 241)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Intensity'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            animation: {
                duration: 0 // Disable animation for better performance
            }
        }
    });
}

// Update emotion timeline with new data
function updateEmotionTimeline(emotion) {
    if (!window.emotionChart) return;
    
    // Add timestamp and emotion to history
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    
    // Simple scoring for emotions (in a real app, this would come from your emotion detection)
    const emotionScores = {
        happy: 0.9,
        sad: 0.3,
        angry: 0.2,
        surprised: 0.8,
        fearful: 0.4,
        disgusted: 0.3,
        neutral: 0.5
    };
    
    const score = emotionScores[emotion] || 0.5;
    
    // Add to history
    emotionHistory.push({
        timestamp,
        emotion,
        score
    });
    
    // Keep only the most recent entries
    if (emotionHistory.length > MAX_HISTORY) {
        emotionHistory.shift();
    }
    
    // Update chart
    updateEmotionChart();
}

// Update the emotion chart with current history
function updateEmotionChart() {
    if (!window.emotionChart) return;
    
    const chart = window.emotionChart;
    const labels = emotionHistory.map(entry => entry.timestamp);
    const data = emotionHistory.map(entry => entry.score);
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
