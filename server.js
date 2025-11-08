const express = require('express');
const path = require('path');
const WebSocket = require('ws');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json());

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    ws.on('message', (message) => {
        console.log('Received:', message);
        // Broadcast to all clients
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});
