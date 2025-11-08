class EmotionDetector {
    constructor() {
        // Video elements
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.emotionDisplay = document.getElementById('emotion-display');
        
        // Audio elements
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.audioData = [];
        this.audioInterval = null;
        
        // Emotion tracking
        this.currentEmotion = { state: 'neutral', confidence: 0.9 };
        this.emotionHistory = [];
        this.isDetecting = false;
        this.faceapi = faceapi;
        
        // Initialize all detectors
        this.initializeFaceAPI();
        this.initializeAudioContext();
        
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
        
        // Mock API clients
        this.affectivaClient = new MockAffectivaClient();
        this.openAIClient = new MockOpenAIClient();
    }

    async initializeFaceAPI() {
        try {
            await this.faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await this.faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await this.faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            await this.faceapi.nets.faceExpressionNet.loadFromUri('/models');
            console.log('Face-API models loaded successfully');
            
            // Set canvas size to match video feed
            this.video.addEventListener('play', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.detectFacialExpressions();
            });
        } catch (error) {
            console.error('Error loading Face-API models:', error);
        }
    }
    
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }

    async startVideo() {
        try {
            // Request both video and audio streams
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                },
                audio: true
            });
            
            // Set up video
            this.video.srcObject = stream;
            this.video.play();
            
            // Set up audio analysis if not already done
            if (this.audioContext && stream.getAudioTracks().length > 0) {
                this.setupAudioAnalysis(stream);
            }
            
            this.isDetecting = true;
            console.log('Started video and audio capture');
            
        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    }
    
    setupAudioAnalysis(stream) {
        try {
            // Create audio source from microphone
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            // Start analyzing audio
            this.audioInterval = setInterval(() => {
                this.analyzeVoiceTone();
            }, 1000); // Analyze every second
            
            console.log('Audio analysis started');
        } catch (error) {
            console.error('Error setting up audio analysis:', error);
        }
    }

    async detectFacialExpressions() {
        if (!this.isDetecting) return;

        try {
            // Use face-api.js for basic face detection
            const detections = await this.faceapi.detectAllFaces(
                this.video,
                new this.faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();

            // Clear and redraw video frame
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            if (detections.length > 0) {
                // Get facial expressions
                const expressions = detections[0].expressions;
                const emotion = this.getDominantEmotion(expressions);
                
                // Get additional facial metrics
                const landmarks = detections[0].landmarks;
                const eyeAspectRatio = this.calculateEyeAspectRatio(landmarks);
                const mouthAspectRatio = this.calculateMouthAspectRatio(landmarks);
                
                // Create a more detailed emotion object
                const emotionData = {
                    emotion,
                    confidence: expressions[emotion],
                    metrics: {
                        eyeAspectRatio,
                        mouthAspectRatio,
                        headPose: this.estimateHeadPose(landmarks)
                    },
                    timestamp: Date.now(),
                    source: 'facial_analysis'
                };
                
                // Send to mock Affectiva API for advanced analysis
                this.affectivaClient.analyzeFacialExpressions(emotionData)
                    .then(enhancedData => {
                        this.updateEmotion(enhancedData);
                    });
                
                // Draw face detection and landmarks
                const resizedDetections = this.faceapi.resizeResults(detections, {
                    width: this.video.videoWidth,
                    height: this.video.videoHeight
                });
                
                this.faceapi.draw.drawDetections(this.canvas, resizedDetections);
                this.faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
                
                // Draw emotion text
                this.ctx.font = '20px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(`${this.emotionEmojis[emotion] || '😐'} ${emotion} (${(expressions[emotion] * 100).toFixed(1)}%)`, 20, 40);
            }
        } catch (error) {
            console.error('Error detecting facial expressions:', error);
        }

        requestAnimationFrame(() => this.detectFacialExpressions());
    }
    
    calculateEyeAspectRatio(landmarks) {
        // Simple eye aspect ratio calculation (for blink detection)
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        const leftEAR = (this.getDistance(leftEye[1], leftEye[5]) + 
                        this.getDistance(leftEye[2], leftEye[4])) / 
                       (2 * this.getDistance(leftEye[0], leftEye[3]));
                       
        const rightEAR = (this.getDistance(rightEye[1], rightEye[5]) + 
                         this.getDistance(rightEye[2], rightEye[4])) / 
                        (2 * this.getDistance(rightEye[0], rightEye[3]));
        
        return (leftEAR + rightEAR) / 2;
    }
    
    calculateMouthAspectRatio(landmarks) {
        // Simple mouth aspect ratio calculation (for smile detection)
        const mouth = landmarks.getMouth();
        const mouthWidth = this.getDistance(mouth[0], mouth[6]);
        const mouthHeight = this.getDistance(mouth[3], mouth[9]);
        
        return mouthHeight / mouthWidth;
    }
    
    getDistance(point1, point2) {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    }
    
    estimateHeadPose(landmarks) {
        // Simple head pose estimation (pitch, yaw, roll)
        // This is a simplified version - in production, use a proper pose estimation model
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        // Calculate roll (tilt)
        const eyeCenter = {
            x: (leftEye[0].x + rightEye[3].x) / 2,
            y: (leftEye[0].y + rightEye[3].y) / 2
        };
        
        const angle = Math.atan2(
            rightEye[3].y - leftEye[0].y,
            rightEye[3].x - leftEye[0].x
        ) * (180 / Math.PI);
        
        return {
            pitch: 0, // Would require 3D landmarks
            yaw: 0,   // Would require 3D landmarks
            roll: angle
        };
    }
    
    async analyzeVoiceTone() {
        if (!this.analyser) return;
        
        try {
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate basic audio features
            let sum = 0;
            let max = 0;
            let zeroCrossings = 0;
            
            // Get time domain data for zero crossing and volume analysis
            const timeData = new Uint8Array(bufferLength);
            this.analyser.getByteTimeDomainData(timeData);
            
            let prevSample = timeData[0];
            for (let i = 1; i < timeData.length; i++) {
                sum += timeData[i];
                if (timeData[i] > max) max = timeData[i];
                
                // Detect zero crossings
                if ((prevSample < 128 && timeData[i] >= 128) || 
                    (prevSample >= 128 && timeData[i] < 128)) {
                    zeroCrossings++;
                }
                prevSample = timeData[i];
            }
            
            const averageVolume = sum / timeData.length;
            const volumeRatio = averageVolume / 255; // Normalize to 0-1
            const zeroCrossingRate = zeroCrossings / (timeData.length / this.audioContext.sampleRate);
            
            // Simple voice emotion estimation based on audio features
            let voiceEmotion = 'neutral';
            let confidence = 0.7;
            
            if (volumeRatio > 0.6 && zeroCrossingRate > 100) {
                voiceEmotion = 'excited';
                confidence = 0.8;
            } else if (volumeRatio < 0.3 && zeroCrossingRate < 50) {
                voiceEmotion = 'sad';
                confidence = 0.75;
            } else if (volumeRatio > 0.7) {
                voiceEmotion = 'angry';
                confidence = 0.8;
            }
            
            // Send to mock API for more advanced analysis
            const voiceData = {
                emotion: voiceEmotion,
                confidence,
                metrics: {
                    volume: volumeRatio,
                    zeroCrossingRate,
                    pitch: this.estimatePitch(dataArray)
                },
                timestamp: Date.now(),
                source: 'voice_analysis'
            };
            
            this.affectivaClient.analyzeVoiceTone(voiceData)
                .then(enhancedData => {
                    this.updateEmotion(enhancedData);
                });
                
        } catch (error) {
            console.error('Error analyzing voice tone:', error);
        }
    }
    
    estimatePitch(frequencyData) {
        // Simple pitch estimation (in a real app, use autocorrelation or YIN algorithm)
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            if (frequencyData[i] > maxValue) {
                maxValue = frequencyData[i];
                maxIndex = i;
            }
        }
        
        // Convert frequency bin to Hz
        return maxIndex * (this.audioContext.sampleRate / 2) / frequencyData.length;
    }
    
    async analyzeTextSentiment(text) {
        try {
            // Use mock OpenAI API for text analysis
            const sentiment = await this.openAIClient.analyzeTextEmotion(text);
            
            const textData = {
                emotion: sentiment.emotion,
                confidence: sentiment.confidence,
                text: text,
                timestamp: Date.now(),
                source: 'text_analysis',
                metrics: {
                    sentimentScore: sentiment.score,
                    keywords: sentiment.keywords || []
                }
            };
            
            this.updateEmotion(textData);
            return textData;
            
        } catch (error) {
            console.error('Error analyzing text sentiment:', error);
            return { emotion: 'neutral', confidence: 0.5 };
        }
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
        
        // Map to our standard emotion set if needed
        const emotionMap = {
            'happy': 'happy',
            'sad': 'sad',
            'angry': 'angry',
            'fearful': 'fearful',
            'disgusted': 'disgusted',
            'surprised': 'surprised',
            'neutral': 'neutral'
        };
        
        return emotionMap[maxEmotion] || 'neutral';
    }
    
    combineEmotions(emotions) {
        // Simple weighted average of emotions from different sources
        const emotionScores = {};
        const sourceWeights = {
            'facial_analysis': 0.5,
            'voice_analysis': 0.3,
            'text_analysis': 0.2
        };
        
        // Initialize emotion scores
        const allEmotions = ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted', 'anxious', 'calm', 'excited'];
        allEmotions.forEach(emotion => {
            emotionScores[emotion] = 0;
        });
        
        // Sum up weighted emotion scores
        emotions.forEach(emotionData => {
            const weight = sourceWeights[emotionData.source] || 0.1;
            const emotion = emotionData.emotion;
            const confidence = emotionData.confidence || 0.5;
            
            emotionScores[emotion] = (emotionScores[emotion] || 0) + (weight * confidence);
        });
        
        // Find the emotion with the highest score
        let dominantEmotion = 'neutral';
        let maxScore = 0;
        
        for (const [emotion, score] of Object.entries(emotionScores)) {
            if (score > maxScore) {
                maxScore = score;
                dominantEmotion = emotion;
            }
        }
        
        // Normalize confidence to 0-1 range
        const confidence = Math.min(1, maxScore);
        
        return {
            state: dominantEmotion,
            confidence: parseFloat(confidence.toFixed(2))
        };
    }

    updateEmotion(emotionData) {
        if (!emotionData) return;
        
        // Add to history
        this.emotionHistory.push({
            ...emotionData,
            timestamp: new Date().toISOString()
        });
        
        // Keep only the last 100 emotions in history
        if (this.emotionHistory.length > 100) {
            this.emotionHistory.shift();
        }
        
        // Get recent emotions from all sources (last 5 seconds)
        const recentEmotions = this.emotionHistory.filter(e => 
            Date.now() - new Date(e.timestamp).getTime() < 5000
        );
        
        if (recentEmotions.length > 0) {
            // Combine emotions from different sources
            const combinedEmotion = this.combineEmotions(recentEmotions);
            
            // Only update if there's a significant change
            if (this.shouldUpdateEmotion(combinedEmotion)) {
                this.currentEmotion = combinedEmotion;
                this.updateEmotionDisplay();
                
                // Notify other components about emotion change
                const event = new CustomEvent('emotionChange', { 
                    detail: { 
                        emotion: combinedEmotion.state,
                        confidence: combinedEmotion.confidence,
                        source: emotionData.source
                    } 
                });
                document.dispatchEvent(event);
            }
        }
    }
    
    shouldUpdateEmotion(newEmotion) {
        // Don't update if the emotion is the same
        if (newEmotion.state === this.currentEmotion.state) {
            return false;
        }
        
        // Update if confidence is high enough
        if (newEmotion.confidence > 0.7) {
            return true;
        }
        
        // Update if the current emotion is neutral and we have any signal
        if (this.currentEmotion.state === 'neutral' && newEmotion.confidence > 0.5) {
            return true;
        }
        
        return false;
    }

    updateEmotionDisplay() {
        if (!this.emotionDisplay) return;
        
        const emotion = this.currentEmotion.state;
        const confidence = this.currentEmotion.confidence;
        
        const emotionMap = {
            'happy': '😊 Happy',
            'sad': '😢 Sad',
            'angry': '😠 Angry',
            'fearful': '😨 Fearful',
            'disgusted': '🤢 Disgusted',
            'surprised': '😲 Surprised',
            'neutral': '😐 Neutral',
            'anxious': '😟 Anxious',
            'calm': '😌 Calm',
            'excited': '🤩 Excited'
        };
        
        // Update the display with emoji and confidence
        const displayText = `${this.emotionEmojis[emotion] || '😐'} ${emotionMap[emotion] || 'Neutral'} (${Math.round(confidence * 100)}%)`;
        this.emotionDisplay.textContent = displayText;
        
        // Update the class for styling
        this.emotionDisplay.className = `emotion-${emotion}`;
        
        // Add a subtle animation for emotion changes
        this.emotionDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.emotionDisplay.style.transform = 'scale(1)';
        }, 200);
    }

    // Text analysis is now handled by analyzeTextSentiment()
    // which uses the mock OpenAI client

    // Voice analysis is now handled by analyzeVoiceTone()
    // which uses the Web Audio API and mock Affectiva client

    stopDetection() {
        this.isDetecting = false;
        
        // Stop video stream
        const stream = this.video.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        // Stop audio analysis
        if (this.audioInterval) {
            clearInterval(this.audioInterval);
            this.audioInterval = null;
        }
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        console.log('Stopped all detection');
    }

    getEmotionHistory() {
        return [...this.emotionHistory];
    }

    getCurrentEmotion() {
        return this.currentEmotion;
    }
}

// Mock API Clients
class MockAffectivaClient {
    constructor() {
        this.baseUrl = 'https://api.affectiva-mock.com/v1';
        this.apiKey = 'mock_affectiva_api_key';
    }
    
    async analyzeFacialExpressions(faceData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Enhance with mock data
        return {
            ...faceData,
            enhanced: true,
            metrics: {
                ...faceData.metrics,
                engagement: Math.random().toFixed(2),
                attention: (0.7 + Math.random() * 0.3).toFixed(2)
            },
            confidence: (faceData.confidence * (0.9 + Math.random() * 0.1)).toFixed(2)
        };
    }
    
    async analyzeVoiceTone(voiceData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Enhance with mock data
        return {
            ...voiceData,
            enhanced: true,
            metrics: {
                ...voiceData.metrics,
                speechRate: (100 + Math.random() * 50).toFixed(2),
                pitchVariation: (0.5 + Math.random() * 0.5).toFixed(2)
            },
            confidence: (voiceData.confidence * (0.85 + Math.random() * 0.15)).toFixed(2)
        };
    }
}

class MockOpenAIClient {
    constructor() {
        this.apiKey = 'mock_openai_api_key';
    }
    
    async analyzeTextEmotion(text) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simple sentiment analysis
        const positiveWords = ['happy', 'joy', 'excited', 'great', 'wonderful', 'love', 'amazing', 'good', 'awesome', 'excellent'];
        const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'upset', 'mad', 'frustrated', 'disappointed'];
        const anxiousWords = ['worried', 'anxious', 'nervous', 'stressed', 'concerned'];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;
        let anxiousScore = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore += 1;
            if (negativeWords.includes(word)) negativeScore += 1;
            if (anxiousWords.includes(word)) anxiousScore += 1;
        });
        
        // Calculate overall sentiment
        let emotion = 'neutral';
        let confidence = 0.7;
        
        if (anxiousScore > 0) {
            emotion = 'anxious';
            confidence = 0.8;
        } else if (positiveScore > negativeScore && positiveScore > 0) {
            emotion = 'happy';
            confidence = Math.min(0.95, 0.7 + (positiveScore * 0.05));
        } else if (negativeScore > positiveScore && negativeScore > 0) {
            emotion = 'sad';
            confidence = Math.min(0.9, 0.65 + (negativeScore * 0.05));
        } else if (text.includes('!') && text.length > 0) {
            emotion = 'excited';
            confidence = 0.75;
        } else if (text.toLowerCase().includes('calm') || text.toLowerCase().includes('relax')) {
            emotion = 'calm';
            confidence = 0.8;
        }
        
        return {
            emotion,
            confidence,
            score: positiveScore - negativeScore,
            keywords: [...new Set(words.filter(word => 
                positiveWords.includes(word) || 
                negativeWords.includes(word) ||
                anxiousWords.includes(word)
            ))]
        };
    }
}

// Initialize emotion detector when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the emotion detector
    window.emotionDetector = new EmotionDetector();
    
    // Start video and audio when the start button is clicked
    document.getElementById('startVideo')?.addEventListener('click', () => {
        window.emotionDetector.startVideo();
    });
    
    // Stop detection when navigating away
    window.addEventListener('beforeunload', () => {
        window.emotionDetector?.stopDetection();
    });
    
    // Example of how to analyze text sentiment from chat input
    const chatInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    
    const handleSendMessage = async () => {
        const text = chatInput.value.trim();
        if (text) {
            // Analyze text sentiment when sending a message
            await window.emotionDetector.analyzeTextSentiment(text);
            
            // Clear input
            chatInput.value = '';
        }
    };
    
    if (sendButton && chatInput) {
        sendButton.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }
});
