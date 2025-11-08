class EmpathyAssistant {
    constructor() {
        this.suggestionsContainer = document.getElementById('suggestions');
        this.suggestionList = document.getElementById('suggestion-list');
        this.currentContext = [];
        this.conversationHistory = [];
        this.emotionHistory = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for emotion changes from the detector
        document.addEventListener('emotionChange', (e) => {
            this.handleEmotionChange(e.detail.emotion);
        });

        // Listen for new messages in the chat
        document.addEventListener('newMessage', (e) => {
            this.analyzeConversation(e.detail);
        });
    }

    handleEmotionChange(emotion) {
        this.emotionHistory.push({
            emotion,
            timestamp: new Date().toISOString()
        });

        // Keep only the last 50 emotions in history
        if (this.emotionHistory.length > 50) {
            this.emotionHistory.shift();
        }

        this.updateContextWithEmotion(emotion);
    }

    updateContextWithEmotion(emotion) {
        // Update context based on the current emotion
        const emotionContext = this.getEmotionContext(emotion);
        this.currentContext = [...this.currentContext, ...emotionContext];
        
        // Keep context size manageable
        if (this.currentContext.length > 10) {
            this.currentContext = this.currentContext.slice(-10);
        }
    }

    getEmotionContext(emotion) {
        const emotionContexts = {
            happy: [
                "User appears to be in a positive mood",
                "Continue the conversation positively"
            ],
            sad: [
                "User seems to be feeling down",
                "Show empathy and support"
            ],
            angry: [
                "User appears frustrated or upset",
                "Remain calm and understanding",
                "Avoid confrontational language"
            ],
            surprised: [
                "User seems surprised",
                "Acknowledge the surprise"
            ],
            neutral: [
                "User's emotional state is neutral",
                "Continue the conversation naturally"
            ]
        };

        return emotionContexts[emotion] || [];
    }

    analyzeConversation(message) {
        // Add message to conversation history
        this.conversationHistory.push({
            role: message.role,
            content: message.content,
            timestamp: new Date().toISOString()
        });

        // Keep conversation history manageable
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }

        // Only analyze user messages
        if (message.role === 'user') {
            this.generateSuggestions(message.content);
        }
    }

    async generateSuggestions(userInput) {
        try {
            // Get the current emotion from the detector
            const currentEmotion = window.emotionDetector?.getCurrentEmotion() || 'neutral';
            
            // Prepare the context for the suggestion
            const context = {
                currentEmotion,
                recentEmotions: this.emotionHistory.slice(-5).map(e => e.emotion),
                lastMessages: this.conversationHistory.slice(-3)
            };

            // Generate suggestions based on the context
            const suggestions = this.getContextualSuggestions(context, userInput);
            
            // Display the suggestions
            this.displaySuggestions(suggestions);
            
        } catch (error) {
            console.error('Error generating suggestions:', error);
        }
    }

    getContextualSuggestions(context, userInput) {
        const { currentEmotion, recentEmotions } = context;
        const suggestions = [];
        const input = userInput.toLowerCase();

        // Emotion-based suggestions
        if (currentEmotion === 'sad' || recentEmotions.includes('sad')) {
            suggestions.push("I can see this is tough for you. Would you like to talk more about it?");
            suggestions.push("I'm here to listen. Take your time.");
            suggestions.push("That sounds really difficult. How can I support you right now?");
        } 
        else if (currentEmotion === 'angry' || recentEmotions.includes('angry')) {
            suggestions.push("I hear your frustration. Let's work through this together.");
            suggestions.push("I can see you're upset. Would it help to take a moment?");
        }
        else if (currentEmotion === 'happy' || recentEmotion === 'happy') {
            suggestions.push("I'm glad to see you're feeling positive! What's making you happy today?");
        }

        // Content-based suggestions
        if (input.includes('?')) {
            suggestions.push("That's an interesting question. Let me think about that...");
            suggestions.push("I understand you're looking for information. Let me help with that.");
        }

        if (input.includes('!')) {
            suggestions.push("I can see this is important to you.");
        }

        // Default suggestions if none matched
        if (suggestions.length === 0) {
            suggestions.push("I understand. Please tell me more.");
            suggestions.push("That's interesting. Could you elaborate?");
            suggestions.push("I'm here to listen. What else is on your mind?");
        }

        return suggestions.slice(0, 3); // Return max 3 suggestions
    }

    displaySuggestions(suggestions) {
        // Clear previous suggestions
        this.suggestionList.innerHTML = '';
        
        // Add new suggestions
        suggestions.forEach((suggestion, index) => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item p-2 hover:bg-indigo-100 rounded cursor-pointer text-sm text-indigo-800';
            suggestionElement.textContent = suggestion;
            
            // Add click handler to insert suggestion into chat
            suggestionElement.addEventListener('click', () => {
                this.useSuggestion(suggestion);
            });
            
            this.suggestionList.appendChild(suggestionElement);
        });
        
        // Show the suggestions container
        this.suggestionsContainer.classList.remove('hidden');
    }

    useSuggestion(suggestion) {
        // Hide suggestions
        this.suggestionsContainer.classList.add('hidden');
        
        // Dispatch event to add the suggestion to the chat
        const event = new CustomEvent('useSuggestion', { 
            detail: { suggestion } 
        });
        document.dispatchEvent(event);
    }

    getConversationAnalysis() {
        // Analyze the conversation for insights
        const emotionCounts = {};
        this.emotionHistory.forEach(entry => {
            emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
        });

        // Get most common emotion
        let dominantEmotion = 'neutral';
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(emotionCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominantEmotion = emotion;
            }
        }

        return {
            totalMessages: this.conversationHistory.length,
            emotionDistribution: emotionCounts,
            dominantEmotion,
            conversationTopics: this.analyzeTopics(),
            sentimentTrend: this.analyzeSentimentTrend()
        };
    }

    analyzeTopics() {
        // Simple topic extraction (can be enhanced with NLP)
        const topics = new Set();
        const commonWords = new Set(['the', 'and', 'you', 'that', 'have', 'for', 'with', 'this', 'are']);
        
        this.conversationHistory.forEach(entry => {
            const words = entry.content.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 4 && !commonWords.has(word)) {
                    topics.add(word);
                }
            });
        });
        
        return Array.from(topics).slice(0, 5); // Return top 5 topics
    }

    analyzeSentimentTrend() {
        // Simple sentiment trend analysis
        if (this.emotionHistory.length < 2) return 'neutral';
        
        const recentEmotions = this.emotionHistory.slice(-5);
        const emotionScores = {
            'happy': 2,
            'surprised': 1,
            'neutral': 0,
            'sad': -1,
            'angry': -2,
            'fearful': -1.5,
            'disgusted': -1.5
        };
        
        let totalScore = 0;
        recentEmotions.forEach(entry => {
            totalScore += emotionScores[entry.emotion] || 0;
        });
        
        const averageScore = totalScore / recentEmotions.length;
        
        if (averageScore > 0.5) return 'improving';
        if (averageScore < -0.5) return 'declining';
        return 'stable';
    }
}

// Initialize empathy assistant when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.empathyAssistant = new EmpathyAssistant();
});
