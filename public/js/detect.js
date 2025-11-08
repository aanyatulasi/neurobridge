class EmotionDetector {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.emotionDisplay = document.getElementById('emotion-display');
        this.emotionDetails = document.getElementById('emotion-details');
        this.emotionIcon = document.getElementById('emotion-icon');
        this.tooltip = document.getElementById('tooltip');
        
        // Emotion tracking
        this.currentEmotion = { state: 'neutral', confidence: 0 };
        this.emotionHistory = [];
        this.isDetecting = false;
        
        // Emotion mapping to emojis
        this.emotionEmojis = {
            'happy': '😊',
            'sad': '😔',
            'angry': '😠',
            'surprised': '😲',
            'fearful': '😨',
            'disgusted': '🤢',
            'neutral': '😐',
            'anxious': '😟',
            'calm': '😌',
            'excited': '🤩'
        };
        
        // Initialize
        this.initializeEventListeners();
    }

    async startDetection() {
        try {
            // Load face-api models
            await this.loadModels();
            
            // Start video stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            this.video.srcObject = stream;
            this.isDetecting = true;
            
            // Set canvas size to match video
            this.video.onloadedmetadata = () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.detectEmotions();
            };
            
            return true;
        } catch (error) {
            console.error('Error starting detection:', error);
            this.showError('Could not access camera. Please check permissions.');
            return false;
        }
    }

    async loadModels() {
        try {
            // Load face-api models from CDN
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
            ]);
        } catch (error) {
            console.error('Error loading models:', error);
            throw new Error('Failed to load emotion detection models');
        }
    }

    async detectEmotions() {
        if (!this.isDetecting) return;

        try {
            // Detect faces and expressions
            const detections = await faceapi.detectAllFaces(
                this.video,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();

            // Update emotion display
            if (detections.length > 0) {
                const expressions = detections[0].expressions;
                const emotions = Object.entries(expressions);
                const sortedEmotions = emotions.sort((a, b) => b[1] - a[0]);
                const [dominantEmotion, confidence] = sortedEmotions[0];
                
                this.currentEmotion = {
                    state: dominantEmotion,
                    confidence: Math.round(confidence * 100) / 100
                };
                
                this.updateEmotionDisplay();
            }

            // Draw detections on canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            faceapi.draw.drawDetections(this.canvas, detections);
            faceapi.draw.drawFaceLandmarks(this.canvas, detections);

            // Continue detection
            requestAnimationFrame(() => this.detectEmotions());
        } catch (error) {
            console.error('Error detecting emotions:', error);
            setTimeout(() => this.detectEmotions(), 1000);
        }
    }

    updateEmotionDisplay() {
        // Update the emotion display with emoji and confidence
        const emoji = this.emotionEmojis[this.currentEmotion.state] || '❓';
        this.emotionDisplay.innerHTML = emoji;
        this.emotionDetails.textContent = `Confidence: ${Math.round(this.currentEmotion.confidence * 100)}%`;
        
        // Update the emotion icon in the overlay
        this.emotionIcon.className = this.getEmotionIconClass(this.currentEmotion.state);
        
        // Update the tooltip
        this.tooltip.innerHTML = `
            <p class="font-medium">Detected: ${this.capitalizeFirstLetter(this.currentEmotion.state)}</p>
            <p>Confidence: ${Math.round(this.currentEmotion.confidence * 100)}%</p>
        `;
        this.tooltip.classList.remove('hidden');
        
        // Trigger empathy suggestions based on emotion
        this.triggerEmpathySuggestion();
    }

    getEmotionIconClass(emotion) {
        const iconMap = {
            'happy': 'fas fa-smile text-yellow-400',
            'sad': 'fas fa-sad-tear text-blue-400',
            'angry': 'fas fa-angry text-red-500',
            'surprised': 'fas fa-surprise text-yellow-300',
            'fearful': 'fas fa-flushed text-purple-400',
            'disgusted': 'fas fa-grimace text-green-500',
            'neutral': 'fas fa-meh text-gray-400',
            'anxious': 'fas fa-tired text-orange-400',
            'calm': 'fas fa-smile-beam text-teal-400',
            'excited': 'fas fa-grin-stars text-pink-400'
        };
        return iconMap[emotion] || 'fas fa-question-circle text-gray-400';
    }

    triggerEmpathySuggestion() {
        // This would be more sophisticated in a real app
        const suggestions = {
            'sad': 'The user seems a bit down. Consider asking how they\'re feeling.',
            'angry': 'The user seems frustrated. Try to be patient and understanding.',
            'anxious': 'The user seems anxious. Speak in a calm, reassuring tone.'
        };

        const suggestion = suggestions[this.currentEmotion.state];
        if (suggestion && this.currentEmotion.confidence > 0.7) {
            console.log('Empathy suggestion:', suggestion);
            this.showEmpathySuggestion(suggestion);
        }
    }

    showEmpathySuggestion(suggestion) {
        // This would show a notification or update the UI
        console.log('Suggestion:', suggestion);
    }

    showError(message) {
        // Show error message to user
        console.error(message);
        // You could update the UI to show this error
    }

    stopDetection() {
        this.isDetecting = false;
        const stream = this.video.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    initializeEventListeners() {
        // Tooltip hover
        const emotionOverlay = document.getElementById('emotion-overlay');
        if (emotionOverlay) {
            emotionOverlay.addEventListener('mouseenter', () => {
                this.tooltip.classList.remove('hidden');
            });
            
            emotionOverlay.addEventListener('mouseleave', () => {
                this.tooltip.classList.add('hidden');
            });
        }
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emotionDetector = new EmotionDetector();
});
