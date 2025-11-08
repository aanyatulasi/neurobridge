require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');
const backendRoutes = require('./backend');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from the public directory

// In-memory storage (replace with a database in production)
const users = new Map();
const conversations = new Map();
const activeConnections = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    activeConnections.add(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
            
            // Broadcast to all connected clients
            activeConnections.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'message',
                        data: data
                    }));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        activeConnections.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString()
    }));
});

// API Endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Emotion Analysis Endpoints
app.use('/api', backendRoutes);

app.get('/api/users', (req, res) => {
    res.json(Array.from(users.values()));
});

app.post('/api/users', (req, res) => {
    const user = req.body;
    if (!user.name || !user.email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const id = Date.now().toString();
    const newUser = { id, ...user, createdAt: new Date().toISOString() };
    users.set(id, newUser);
    res.status(201).json(newUser);
});

app.get('/api/conversations', (req, res) => {
    res.json(Array.from(conversations.values()));
});

app.post('/api/conversations', (req, res) => {
    const conversation = req.body;
    if (!conversation.userId || !conversation.message) {
        return res.status(400).json({ error: 'userId and message are required' });
    }
    
    const id = Date.now().toString();
    const newConversation = { 
        id, 
        ...conversation, 
        timestamp: new Date().toISOString() 
    };
    conversations.set(id, newConversation);
    
    // Broadcast new conversation to all connected clients
    broadcastToClients({
        type: 'new_conversation',
        data: newConversation
    });
    
    res.status(201).json(newConversation);
});

// Text emotion analysis endpoint
app.post('/api/analyze-text', (req, res) => {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required' });
    }
    
    // Simple text analysis (replace with actual NLP in production)
    const positiveWords = ['happy', 'joy', 'excited', 'good', 'great', 'amazing', 'love', 'like'];
    const negativeWords = ['sad', 'angry', 'bad', 'terrible', 'awful', 'hate', 'dislike'];
    const anxiousWords = ['anxious', 'nervous', 'worried', 'scared', 'afraid'];
    const calmWords = ['calm', 'relaxed', 'peaceful', 'chill'];
    
    const words = text.toLowerCase().split(/\s+/);
    let scores = {
        happy: 0,
        sad: 0,
        angry: 0,
        neutral: 0,
        anxious: 0,
        calm: 0,
        excited: 0
    };
    
    words.forEach(word => {
        if (positiveWords.includes(word)) scores.happy += 2;
        if (negativeWords.includes(word)) scores.sad += 2;
        if (anxiousWords.includes(word)) scores.anxious += 2;
        if (calmWords.includes(word)) scores.calm += 2;
        if (word.includes('!')) scores.excited += 1;
    });
    
    // Add some randomness to make it more interesting
    Object.keys(scores).forEach(key => {
        scores[key] += Math.random() * 0.5;
    });
    
    // Find the dominant emotion
    let dominantEmotion = 'neutral';
    let maxScore = 0;
    
    for (const [emotion, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            dominantEmotion = emotion;
        }
    }
    
    // Calculate confidence (normalized between 0.5 and 1.0)
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 
        ? 0.5 + (0.5 * (maxScore / totalScore))
        : 0.7; // Default confidence if no words matched
    
    res.json({
        emotion: dominantEmotion,
        confidence: Math.min(Math.max(confidence, 0.5), 1.0).toFixed(2),
        analysis: {
            wordCount: words.length,
            scores: scores
        }
    });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper function to broadcast to all connected clients
function broadcastToClients(data) {
    const message = JSON.stringify(data);
    activeConnections.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
