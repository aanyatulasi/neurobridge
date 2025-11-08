// animations.js - Smooth animations and transitions for NeuroBridge

// Emotion color mapping
const emotionColors = {
    happy: 'from-yellow-300 via-amber-200 to-yellow-400',
    sad: 'from-blue-300 via-indigo-300 to-blue-500',
    angry: 'from-red-400 via-rose-400 to-red-600',
    surprised: 'from-purple-300 via-pink-300 to-purple-500',
    fearful: 'from-purple-400 via-blue-400 to-indigo-600',
    disgusted: 'from-green-400 via-emerald-300 to-green-600',
    neutral: 'from-gray-200 via-gray-100 to-gray-300'
};

// Animation variants for Framer Motion
const animationVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    },
    exit: { 
        opacity: 0, 
        y: -20,
        transition: {
            duration: 0.3,
            ease: "easeIn"
        }
    },
    pulse: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse"
        }
    },
    slideIn: {
        x: ['100%', '0%'],
        opacity: [0, 1],
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

// Update background gradient based on emotion
function updateEmotionBackground(emotion) {
    const mainContainer = document.querySelector('body');
    if (!mainContainer) return;
    
    // Remove all emotion color classes
    Object.values(emotionColors).forEach(colorClass => {
        mainContainer.classList.remove(...colorClass.split(' '));
    });
    
    // Add new gradient classes
    const newColors = emotionColors[emotion] || emotionColors.neutral;
    newColors.split(' ').forEach(className => {
        mainContainer.classList.add(className);
    });
    
    // Add animation class for smooth transition
    mainContainer.classList.add('bg-gradient-to-br', 'transition-colors', 'duration-1000');
}

// Animate emoji with a pulse effect
function animateEmoji(emojiElement) {
    if (!emojiElement) return;
    
    // Reset animation
    emojiElement.style.animation = 'none';
    emojiElement.offsetHeight; // Trigger reflow
    
    // Apply pulse animation
    emojiElement.style.animation = 'pulse 1.5s ease-in-out infinite';
}

// Initialize animations
function initAnimations() {
    // Add keyframes for pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }
        
        @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .emotion-transition {
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .empathy-panel {
            transform: translateX(100%);
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .empathy-panel.visible {
            transform: translateX(0);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize emotion display
    const emotionDisplay = document.getElementById('emotion-display');
    if (emotionDisplay) {
        emotionDisplay.classList.add('emotion-transition');
    }
}

// Toggle therapy mode
let isTherapyMode = false;
function toggleTherapyMode() {
    isTherapyMode = !isTherapyMode;
    const body = document.body;
    
    if (isTherapyMode) {
        body.classList.add('therapy-mode');
        // Apply subtle animations and colors
        body.style.setProperty('--primary-color', 'var(--gray-400)');
        body.style.setProperty('--secondary-color', 'var(--gray-200)');
    } else {
        body.classList.remove('therapy-mode');
        // Reset to default colors
        body.style.removeProperty('--primary-color');
        body.style.removeProperty('--secondary-color');
    }
}

// Toggle mirror mode
let isMirrorMode = false;
function toggleMirrorMode() {
    isMirrorMode = !isMirrorMode;
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    
    if (isMirrorMode) {
        // Apply mirror effect
        if (videoElement) videoElement.style.transform = 'scaleX(-1)';
        if (canvasElement) canvasElement.style.transform = 'scaleX(-1)';
        
        // Show mirror mode UI
        showMirrorFeedback();
    } else {
        // Remove mirror effect
        if (videoElement) videoElement.style.transform = '';
        if (canvasElement) canvasElement.style.transform = '';
        
        // Hide mirror mode UI
        hideMirrorFeedback();
    }
}

// Show mirror feedback UI
function showMirrorFeedback() {
    const feedbackContainer = document.createElement('div');
    feedbackContainer.id = 'mirror-feedback';
    feedbackContainer.className = 'fixed bottom-4 right-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg z-50';
    feedbackContainer.innerHTML = `
        <h3 class="font-bold mb-2">Mirror Mode</h3>
        <p class="text-sm text-gray-600 mb-3">Practice your expressions. We'll give you gentle feedback.</p>
        <div id="expression-feedback" class="text-center py-2">
            <span class="text-2xl">😊</span>
            <p class="text-xs mt-1">Try making different expressions</p>
        </div>
    `;
    document.body.appendChild(feedbackContainer);
}

// Hide mirror feedback UI
function hideMirrorFeedback() {
    const feedback = document.getElementById('mirror-feedback');
    if (feedback) {
        feedback.style.transform = 'translateY(20px)';
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 300);
    }
}

// Initialize animations when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    
    // Add mode toggle buttons to the UI
    addModeToggleButtons();
});

// Add mode toggle buttons to the UI
function addModeToggleButtons() {
    const controls = document.querySelector('.flex.justify-center.space-x-4');
    if (!controls) return;
    
    // Create container for mode toggles
    const modeContainer = document.createElement('div');
    modeContainer.className = 'flex justify-center space-x-2 mt-4';
    
    // Mirror mode toggle button
    const mirrorToggle = document.createElement('button');
    mirrorToggle.id = 'toggle-mirror';
    mirrorToggle.className = 'bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center';
    mirrorToggle.innerHTML = '<i class="fas fa-mirror mr-1"></i> Mirror Mode';
    mirrorToggle.onclick = toggleMirrorMode;
    
    // Therapy mode toggle button
    const therapyToggle = document.createElement('button');
    therapyToggle.id = 'toggle-therapy';
    therapyToggle.className = 'bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center';
    therapyToggle.innerHTML = '<i class="fas fa-heartbeat mr-1"></i> Therapy Mode';
    therapyToggle.onclick = toggleTherapyMode;
    
    // Add buttons to container
    modeContainer.appendChild(mirrorToggle);
    modeContainer.appendChild(therapyToggle);
    
    // Insert after controls
    controls.parentNode.insertBefore(modeContainer, controls.nextSibling);
}

// Export for use in other files
window.NeuroBridgeAnimations = {
    updateEmotionBackground,
    animateEmoji,
    toggleTherapyMode,
    toggleMirrorMode
};
