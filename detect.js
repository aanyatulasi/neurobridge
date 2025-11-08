class EmotionDetector {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.emotionDisplay = document.getElementById('emotion-display');
        this.currentEmotion = 'neutral';
        this.emotionHistory = [];
        this.isDetecting = false;
        this.model = null;
        this.faceapi = faceapi;
        this.initializeFaceAPI();
    }

    async initializeFaceAPI() {
        try {
            await this.faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await this.faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await this.faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            await this.faceapi.nets.faceExpressionNet.loadFromUri('/models');
            console.log('Face-API models loaded successfully');
        } catch (error) {
            console.error('Error loading Face-API models:', error);
        }
    }

    async startVideo() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                },
                audio: false
            });
            this.video.srcObject = stream;
            this.video.play();
            this.isDetecting = true;
            this.detectEmotions();
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access the camera. Please check permissions.');
        }
    }

    async detectEmotions() {
        if (!this.isDetecting) return;

        try {
            const detections = await this.faceapi.detectAllFaces(
                this.video,
                new this.faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            if (detections.length > 0) {
                const expressions = detections[0].expressions;
                const emotion = this.getDominantEmotion(expressions);
                this.updateEmotion(emotion);
                
                // Draw face detection box
                const resizedDetections = this.faceapi.resizeResults(detections, {
                    width: this.video.videoWidth,
                    height: this.video.videoHeight
                });
                this.faceapi.draw.drawDetections(this.canvas, resizedDetections);
                this.faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
            }
        } catch (error) {
            console.error('Error detecting emotions:', error);
        }

        requestAnimationFrame(() => this.detectEmotions());
    }

    getDominantEmotion(expressions) {
        let maxEmotion = 'neutral';
        let maxValue = 0;
        
        for (const [emotion, value] of Object.entries(expressions)) {
            if (value > maxValue) {
                maxValue = value;
                maxEmotion = emotion;
            }
        }
        
        return maxEmotion;
    }

    updateEmotion(emotion) {
        if (emotion !== this.currentEmotion) {
            this.currentEmotion = emotion;
            this.emotionHistory.push({
                emotion,
                timestamp: new Date().toISOString()
            });
            
            // Keep only the last 100 emotions in history
            if (this.emotionHistory.length > 100) {
                this.emotionHistory.shift();
            }
            
            this.updateEmotionDisplay();
            
            // Notify other components about emotion change
            const event = new CustomEvent('emotionChange', { detail: { emotion } });
            document.dispatchEvent(event);
        }
    }

    updateEmotionDisplay() {
        const emotionMap = {
            'happy': '😊 Happy',
            'sad': '😢 Sad',
            'angry': '😠 Angry',
            'fearful': '😨 Fearful',
            'disgusted': '🤢 Disgusted',
            'surprised': '😲 Surprised',
            'neutral': '😐 Neutral'
        };
        
        this.emotionDisplay.textContent = emotionMap[this.currentEmotion] || '😐 Neutral';
        this.emotionDisplay.className = `emotion-${this.currentEmotion}`;
    }

    analyzeTextEmotion(text) {
        // Simple text sentiment analysis (can be enhanced with more sophisticated NLP)
        const positiveWords = ['happy', 'joy', 'excited', 'great', 'wonderful', 'love', 'amazing'];
        const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'upset'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score++;
            if (negativeWords.includes(word)) score--;
        });
        
        if (score > 0) return 'happy';
        if (score < 0) return 'sad';
        return 'neutral';
    }

    analyzeVoiceEmotion(audioData) {
        // Placeholder for voice emotion analysis
        // In a real app, this would use Web Audio API and ML models
        // For now, we'll just return a random emotion for demonstration
        const emotions = ['happy', 'sad', 'angry', 'neutral', 'surprised'];
        return emotions[Math.floor(Math.random() * emotions.length)];
    }

    stopDetection() {
        this.isDetecting = false;
        const stream = this.video.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        this.video.srcObject = null;
    }

    getEmotionHistory() {
        return [...this.emotionHistory];
    }

    getCurrentEmotion() {
        return this.currentEmotion;
    }
}

// Initialize emotion detector when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emotionDetector = new EmotionDetector();
    
    // Start video when the start button is clicked
    document.getElementById('startVideo')?.addEventListener('click', () => {
        window.emotionDetector.startVideo();
    });
    
    // Stop video when navigating away
    window.addEventListener('beforeunload', () => {
        window.emotionDetector?.stopDetection();
    });
});
