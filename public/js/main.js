class NeuroBridgeApp {
    constructor() {
        this.emotionDetector = window.emotionDetector;
        this.isAudioActive = false;
        this.sessionStartTime = new Date();
        this.sessionTimer = null;
        
        this.initializeEventListeners();
        this.startSessionTimer();
    }

    initializeEventListeners() {
        // Start/Stop Camera
        const startVideoBtn = document.getElementById('startVideo');
        const startAudioBtn = document.getElementById('startAudio');
        const stopAllBtn = document.getElementById('stopAll');
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        const emotionIconContainer = document.getElementById('emotion-icon-container');

        if (startVideoBtn) {
            startVideoBtn.addEventListener('click', () => this.toggleVideo());
        }

        if (startAudioBtn) {
            startAudioBtn.addEventListener('click', () => this.toggleAudio());
        }

        if (stopAllBtn) {
            stopAllBtn.addEventListener('click', () => this.stopAll());
        }

        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }

        // Toggle tooltip on emotion icon click
        if (emotionIconContainer) {
            emotionIconContainer.addEventListener('click', () => {
                const tooltip = document.getElementById('tooltip');
                tooltip.classList.toggle('hidden');
            });
        }
    }

    async toggleVideo() {
        const startVideoBtn = document.getElementById('startVideo');
        
        if (this.emotionDetector.isDetecting) {
            this.emotionDetector.stopDetection();
            startVideoBtn.innerHTML = '<i class="fas fa-video mr-2"></i> Start Camera';
            startVideoBtn.classList.remove('bg-indigo-700');
            startVideoBtn.classList.add('bg-indigo-600');
        } else {
            const started = await this.emotionDetector.startDetection();
            if (started) {
                startVideoBtn.innerHTML = '<i class="fas fa-stop mr-2"></i> Stop Camera';
                startVideoBtn.classList.remove('bg-indigo-600');
                startVideoBtn.classList.add('bg-indigo-700');
            }
        }
    }

    toggleAudio() {
        const startAudioBtn = document.getElementById('startAudio');
        this.isAudioActive = !this.isAudioActive;
        
        if (this.isAudioActive) {
            startAudioBtn.innerHTML = '<i class="fas fa-microphone-slash mr-2"></i> Stop Voice';
            startAudioBtn.classList.remove('bg-emerald-600');
            startAudioBtn.classList.add('bg-emerald-700');
            this.startVoiceRecognition();
        } else {
            startAudioBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i> Start Voice';
            startAudioBtn.classList.remove('bg-emerald-700');
            startAudioBtn.classList.add('bg-emerald-600');
            this.stopVoiceRecognition();
        }
    }

    startVoiceRecognition() {
        // Check if browser supports Web Speech API
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('Your browser does not support speech recognition. Try Chrome or Edge.');
            return;
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        // Handle results
        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            // Update message input with transcript
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = transcript;
                
                // If this is a final result, send the message
                if (event.results[0].isFinal) {
                    this.handleSendMessage();
                }
            }
        };
        
        // Handle errors
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.stopVoiceRecognition();
        };
        
        // Start recognition
        try {
            this.recognition.start();
            console.log('Voice recognition started');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.showError('Error accessing microphone. Please check permissions.');
        }
    }

    stopVoiceRecognition() {
        if (this.recognition) {
            try {
                this.recognition.stop();
                console.log('Voice recognition stopped');
            } catch (error) {
                console.error('Error stopping voice recognition:', error);
            }
            this.recognition = null;
        }
        this.isAudioActive = false;
        
        // Update UI
        const startAudioBtn = document.getElementById('startAudio');
        if (startAudioBtn) {
            startAudioBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i> Start Voice';
            startAudioBtn.classList.remove('bg-emerald-700');
            startAudioBtn.classList.add('bg-emerald-600');
        }
    }

    stopAll() {
        // Stop video detection
        this.emotionDetector.stopDetection();
        
        // Stop audio
        this.stopVoiceRecognition();
        
        // Reset UI
        const startVideoBtn = document.getElementById('startVideo');
        const startAudioBtn = document.getElementById('startAudio');
        
        if (startVideoBtn) {
            startVideoBtn.innerHTML = '<i class="fas fa-video mr-2"></i> Start Camera';
            startVideoBtn.classList.remove('bg-indigo-700');
            startVideoBtn.classList.add('bg-indigo-600');
        }
        
        if (startAudioBtn) {
            startAudioBtn.innerHTML = '<i class="fas fa-microphone mr-2"></i> Start Voice';
            startAudioBtn.classList.remove('bg-emerald-700');
            startAudioBtn.classList.add('bg-emerald-600');
        }
        
        document.getElementById('emotion-display').innerHTML = '<span class="text-gray-400">😐</span>';
        document.getElementById('emotion-details').textContent = 'Confidence: 0%';
    }

    handleSendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessageToChat('user', message);
        
        // Clear input
        messageInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            this.addMessageToChat('bot', this.generateResponse(message));
        }, 1000);
    }

    addMessageToChat(sender, text) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Remove the welcome message if it exists
        if (chatMessages.children.length === 1 && 
            chatMessages.children[0].classList.contains('text-center')) {
            chatMessages.innerHTML = '';
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message p-3 rounded-lg ${
            sender === 'user' 
                ? 'bg-indigo-600 text-white ml-auto' 
                : 'bg-gray-700 text-white'
        }`;
        messageDiv.textContent = text;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    generateResponse(message) {
        // Simple response generation - in a real app, this would use an AI model
        const responses = [
            "I understand how you feel. Can you tell me more?",
            "That's interesting. What else is on your mind?",
            "I'm here to listen. Please continue.",
            "How does that make you feel?",
            "Thanks for sharing that with me.",
            "I can see why you'd feel that way.",
            "That sounds challenging. Would you like to talk more about it?",
            "I appreciate you sharing that with me.",
            "That's a great point. Tell me more.",
            "I'm here to support you. What else would you like to discuss?"
        ];
        
        // Simple keyword matching for more relevant responses
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('how are you')) {
            return "I'm here to help you. How can I assist you today?";
        } else if (lowerMessage.includes('thank')) {
            return "You're welcome! Is there anything else you'd like to talk about?";
        } else if (lowerMessage.includes('help')) {
            return "I'm here to help. Could you tell me more about what's on your mind?";
        } else if (lowerMessage.includes('sad') || lowerMessage.includes('unhappy') || lowerMessage.includes('depressed')) {
            return "I'm sorry to hear you're feeling this way. It's okay to feel sad sometimes. Would you like to talk about what's bothering you?";
        } else if (lowerMessage.includes('happy') || lowerMessage.includes('excited') || lowerMessage.includes('great')) {
            return "I'm glad to hear you're feeling positive! What's making you feel this way?";
        }
        
        // Random response if no keywords match
        return responses[Math.floor(Math.random() * responses.length)];
    }

    startSessionTimer() {
        this.updateSessionTime();
        this.sessionTimer = setInterval(() => this.updateSessionTime(), 1000);
    }

    updateSessionTime() {
        const now = new Date();
        const diff = Math.floor((now - this.sessionStartTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        
        const durationElement = document.getElementById('session-duration');
        if (durationElement) {
            durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update current emotion in session stats
        const currentEmotionElement = document.getElementById('current-emotion');
        if (currentEmotionElement && this.emotionDetector.currentEmotion) {
            currentEmotionElement.textContent = this.capitalizeFirstLetter(
                this.emotionDetector.currentEmotion.state
            );
        }
    }

    showError(message) {
        // Show error message in the chat
        this.addMessageToChat('bot', `Error: ${message}`);
        
        // Also log to console
        console.error(message);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuroBridgeApp();
});
