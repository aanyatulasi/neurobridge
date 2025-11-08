class EmpathyAssistantUI {
    constructor() {
        this.sidebar = document.getElementById('empathy-sidebar');
        this.toggleButton = document.getElementById('toggle-sidebar');
        this.closeButton = document.getElementById('close-sidebar');
        this.rephraseButton = document.getElementById('rephrase-btn');
        this.messageInput = document.getElementById('message-to-rephrase');
        this.rephrasedResult = document.getElementById('rephrased-result');
        this.rephrasedText = document.getElementById('rephrased-text');
        this.rephrasingLoader = document.getElementById('rephrasing-loader');
        this.toneSuggestions = document.getElementById('tone-suggestions');
        this.useRephraseBtn = document.getElementById('use-rephrase');
        
        this.setupEventListeners();
        this.initializeSuggestions();
    }

    setupEventListeners() {
        // Toggle sidebar
        this.toggleButton.addEventListener('click', () => this.toggleSidebar());
        this.closeButton.addEventListener('click', () => this.toggleSidebar(false));
        
        // Rephrase functionality
        this.rephraseButton.addEventListener('click', () => this.handleRephrase());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleRephrase();
            }
        });
        
        // Use rephrased message
        this.useRephraseBtn.addEventListener('click', () => this.useRephrasedMessage());
    }

    toggleSidebar(show = null) {
        if (show === null) {
            this.sidebar.classList.toggle('show');
        } else if (show) {
            this.sidebar.classList.add('show');
        } else {
            this.sidebar.classList.remove('show');
        }
    }

    async handleRephrase() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.rephraseButton.disabled = true;
        this.rephrasingLoader.classList.remove('hidden');
        this.rephrasedResult.classList.add('hidden');

        try {
            const rephrased = await this.rephraseWithAI(message);
            this.showRephrasedMessage(rephrased);
        } catch (error) {
            console.error('Error rephrasing message:', error);
            this.showError('Failed to rephrase. Please try again.');
        } finally {
            this.rephraseButton.disabled = false;
            this.rephrasingLoader.classList.add('hidden');
        }
    }

    async rephraseWithAI(message) {
        // In a real implementation, you would call the OpenAI API here
        // This is a mock implementation for demonstration
        return new Promise((resolve) => {
            setTimeout(() => {
                const rephrases = [
                    `I was wondering if you could help me understand this better?`,
                    `Could you please clarify what you mean by "${message}"?`,
                    `I'd appreciate it if you could explain this in a different way.`,
                    `Let me rephrase that to be more clear...`
                ];
                resolve(rephrases[Math.floor(Math.random() * rephrases.length)]);
            }, 1000);
        });
        
        // Example of how to implement with OpenAI API (uncomment and configure with your API key):
        /*
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_OPENAI_API_KEY`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that rephrases messages to be more empathetic and clear.'
                    },
                    {
                        role: 'user',
                        content: `Rephrase this message to be more empathetic and clear: "${message}"`
                    }
                ],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
        */
    }

    showRephrasedMessage(message) {
        this.rephrasedText.textContent = message;
        this.rephrasedResult.classList.remove('hidden');
        this.rephrasedResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(message) {
        this.rephrasedText.textContent = message;
        this.rephrasedResult.classList.remove('hidden');
    }

    useRephrasedMessage() {
        const messageInput = document.getElementById('user-input');
        messageInput.value = this.rephrasedText.textContent;
        messageInput.focus();
    }

    initializeSuggestions() {
        // In a real implementation, these would be generated based on conversation context
        const suggestions = [
            "Try asking that more gently: 'Could you please clarify what you mean?'",
            "Consider acknowledging their feelings first: 'I understand this might be frustrating...'"
        ];

        this.toneSuggestions.innerHTML = ''; // Clear any existing suggestions
        
        suggestions.forEach(suggestion => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'suggestion-item glass-card p-3 text-sm text-gray-200';
            suggestionEl.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-lightbulb text-yellow-400 mt-0.5 mr-2"></i>
                    <span>${suggestion}</span>
                </div>
            `;
            this.toneSuggestions.appendChild(suggestionEl);
        });
    }
    
    addToneSuggestion(suggestion) {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'suggestion-item glass-card p-3 text-sm text-gray-200';
        suggestionEl.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-lightbulb text-yellow-400 mt-0.5 mr-2"></i>
                <span>${suggestion}</span>
            </div>
        `;
        this.toneSuggestions.prepend(suggestionEl);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            suggestionEl.style.opacity = '0';
            setTimeout(() => {
                suggestionEl.remove();
            }, 300);
        }, 30000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.empathyAssistantUI = new EmpathyAssistantUI();
    
    // Example of how to add a suggestion programmatically:
    // empathyAssistantUI.addToneSuggestion("Try asking that more gently...");
});
