// Main Application Controller
class NeuroBridgeApp {
    constructor() {
        // Initialize components
        this.emotionDetector = new EmotionDetector();
        this.empathyAssistant = new EmpathyAssistantUI();
        this.dashboard = new Dashboard();
        
        // State management
        this.sessionStartTime = new Date();
        this.emotionHistory = [];
        this.stressThreshold = 0.7; // Threshold for stress detection (0-1)
        this.stressStartTime = null;
        this.mindfulnessActive = false;
        
        // Initialize the application
        this.initializeEventListeners();
        this.startEmotionDetection();
    }

    initializeEventListeners() {
        // Toggle sidebar
        document.getElementById('toggle-sidebar')?.addEventListener('click', () => {
            this.empathyAssistant.toggleSidebar();
        });

        // Send message
        document.getElementById('send-button')?.addEventListener('click', () => {
            this.handleSendMessage();
        });

        // Handle enter key in message input
        document.getElementById('message-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // View dashboard
        document.getElementById('view-dashboard')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.dashboard.showDashboard();
        });
    }

    async startEmotionDetection() {
        try {
            await this.emotionDetector.startDetection(
                (emotion) => this.handleEmotionUpdate(emotion),
                (suggestion) => this.showEmpathySuggestion(suggestion)
            );
        } catch (error) {
            console.error('Error starting emotion detection:', error);
        }
    }

    handleEmotionUpdate(emotion) {
        // Add timestamp to emotion data
        const emotionWithTime = {
            ...emotion,
            timestamp: new Date().toISOString()
        };

        // Update emotion history (keep last 100 entries)
        this.emotionHistory = [...this.emotionHistory.slice(-99), emotionWithTime];

        // Update UI
        this.updateEmotionDisplay(emotion);
        this.checkStressLevel(emotion);
        
        // Log to dashboard
        this.logEmotionToDashboard(emotion);
    }

    updateEmotionDisplay(emotion) {
        const emotionDisplay = document.getElementById('emotion-display');
        if (!emotionDisplay) return;

        // Update emoji and confidence
        const emoji = this.emotionDetector.emotionEmojis[emotion.state] || '❓';
        emotionDisplay.innerHTML = `
            <span class="text-4xl">${emoji}</span>
            <span class="text-sm opacity-75">${Math.round(emotion.confidence * 100)}%</span>
        `;

        // Add tooltip with emotion details
        emotionDisplay.title = `Detected: ${emotion.state} (${Math.round(emotion.confidence * 100)}% confidence)`;
    }

    checkStressLevel(emotion) {
        const isStressed = emotion.state === 'anxious' && emotion.confidence > this.stressThreshold;
        
        if (isStressed) {
            // Start or update stress timer
            if (!this.stressStartTime) {
                this.stressStartTime = Date.now();
            } else if (Date.now() - this.stressStartTime > 3000 && !this.mindfulnessActive) {
                // If stressed for more than 3 seconds, trigger mindfulness prompt
                this.triggerMindfulnessPrompt();
            }
        } else {
            // Reset stress timer if not stressed
            this.stressStartTime = null;
        }
    }

    triggerMindfulnessPrompt() {
        if (this.mindfulnessActive) return;
        
        this.mindfulnessActive = true;
        
        // Show mindfulness prompt
        const prompt = document.createElement('div');
        prompt.className = 'fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-50';
        prompt.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-indigo-700">Mindfulness Break</h3>
                <button id="close-prompt" class="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <p class="text-gray-700 mb-3">You seem a bit stressed. Take a deep breath and try this quick exercise:</p>
            <p class="text-indigo-600 mb-3">Breathe in for 4 seconds, hold for 4 seconds, exhale for 6 seconds. Repeat 3 times.</p>
            <div class="flex justify-end">
                <button id="dismiss-prompt" class="text-sm text-indigo-600 hover:text-indigo-800">I'm good, thanks</button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Add event listeners for prompt buttons
        prompt.querySelector('#close-prompt')?.addEventListener('click', () => {
            prompt.remove();
            this.mindfulnessActive = false;
        });
        
        prompt.querySelector('#dismiss-prompt')?.addEventListener('click', () => {
            prompt.remove();
            this.mindfulnessActive = false;
        });
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                prompt.remove();
                this.mindfulnessActive = false;
            }
        }, 30000);
    }

    showEmpathySuggestion(suggestion) {
        const suggestionElement = document.getElementById('empathy-suggestion');
        if (!suggestionElement) return;
        
        suggestionElement.textContent = suggestion;
        suggestionElement.classList.remove('hidden');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            suggestionElement.classList.add('hidden');
        }, 10000);
    }

    logEmotionToDashboard(emotion) {
        // This would typically send data to a backend service
        // For now, we'll just log it to the console
        console.log('Emotion logged to dashboard:', emotion);
        
        // Update dashboard if it's open
        if (this.dashboard.isOpen()) {
            this.dashboard.updateEmotionData(this.emotionHistory);
        }
    }

    async handleSendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // Add message to chat
        this.addMessageToChat('user', message);
        
        // Clear input
        messageInput.value = '';
        
        try {
            // Analyze sentiment of the message
            const sentiment = await this.emotionDetector.analyzeTextSentiment(message);
            
            // Get an empathetic response
            const response = await this.getEmpatheticResponse(message, sentiment);
            
            // Add bot response to chat
            this.addMessageToChat('bot', response);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessageToChat('bot', "I'm having trouble understanding. Could you rephrase that?");
        }
    }

    addMessageToChat(sender, text) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async getEmpatheticResponse(message, sentiment) {
        // In a real app, this would call your backend API
        // For now, we'll use a simple mock response
        const responses = {
            happy: ["That's great to hear!", "I'm glad you're feeling good!"],
            sad: ["I'm sorry to hear that. Would you like to talk about it?", "That sounds tough. I'm here to listen."],
            angry: ["I can see you're upset. Let's work through this together.", "That sounds frustrating. What's bothering you?"],
            neutral: ["I see. Tell me more.", "Thanks for sharing."]
        };
        
        const sentimentType = sentiment?.state || 'neutral';
        const possibleResponses = responses[sentimentType] || responses.neutral;
        return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load required scripts first
    const scripts = [
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
        'detect.js',
        'empathy-assistant.js',
        'dashboard.js'
    ];
    
    let loaded = 0;
    
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            loaded++;
            if (loaded === scripts.length) {
                // All scripts loaded, initialize app
                window.app = new NeuroBridgeApp();
            }
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            loaded++;
        };
        document.body.appendChild(script);
    });
});
