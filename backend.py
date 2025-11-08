from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional
import uuid
import json
import os
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(title="NeuroBridge API", description="Emotional AI Assistant API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# In-memory storage (replace with a database in production)
conversations = {}
users = {}

# Models
class Message(BaseModel):
    content: str
    sender: str  # 'user' or 'assistant'
    timestamp: str
    emotion: Optional[str] = None

class User(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    created_at: str

class Conversation(BaseModel):
    id: str
    user_id: str
    messages: List[Message]
    created_at: str
    updated_at: str
    emotion_summary: Optional[Dict[str, int]] = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

    async def broadcast(self, message: str, exclude: List[str] = None):
        if exclude is None:
            exclude = []
        for client_id, connection in self.active_connections.items():
            if client_id not in exclude:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"Error broadcasting to {client_id}: {e}")

manager = ConnectionManager()

# Helper functions
def get_timestamp():
    return datetime.utcnow().isoformat()

def analyze_emotion(text: str) -> str:
    """Simple emotion analysis based on keywords"""
    text = text.lower()
    positive_words = ['happy', 'joy', 'excited', 'great', 'wonderful', 'love', 'amazing', 'good', 'awesome']
    negative_words = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'upset', 'mad', 'frustrated']
    
    positive_count = sum(1 for word in positive_words if word in text)
    negative_count = sum(1 for word in negative_words if word in text)
    
    if positive_count > negative_count:
        return 'happy'
    elif negative_count > positive_count:
        return 'sad' if 'angry' not in text and 'mad' not in text and 'frustrated' not in text else 'angry'
    return 'neutral'

# API Endpoints
@app.get("/")
async def read_root():
    return {"message": "Welcome to NeuroBridge API", "status": "running"}

# WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Process the received message
            message_data = json.loads(data)
            
            if message_data["type"] == "message":
                # Create a new message
                message = Message(
                    content=message_data["content"],
                    sender=message_data.get("sender", "user"),
                    timestamp=get_timestamp(),
                    emotion=message_data.get("emotion")
                )
                
                # If no emotion provided, analyze the text
                if not message.emotion:
                    message.emotion = analyze_emotion(message.content)
                
                # Add to conversation
                conversation_id = message_data.get("conversation_id")
                if conversation_id in conversations:
                    conversations[conversation_id].messages.append(message)
                    conversations[conversation_id].updated_at = get_timestamp()
                    
                    # Update emotion summary
                    if message.emotion:
                        if not conversations[conversation_id].emotion_summary:
                            conversations[conversation_id].emotion_summary = {}
                        conversations[conversation_id].emotion_summary[message.emotion] = \
                            conversations[conversation_id].emotion_summary.get(message.emotion, 0) + 1
                
                # Broadcast the message to all connected clients (or just the sender)
                await manager.send_personal_message(
                    json.dumps({
                        "type": "message",
                        "message": message.dict(),
                        "conversation_id": conversation_id
                    }),
                    client_id
                )
                
                # Here you could add logic to generate an AI response
                # and send it back to the client
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(f"Client #{client_id} left the chat")

# Conversation endpoints
@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(user_id: str):
    """Create a new conversation"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    conversation_id = str(uuid.uuid4())
    now = get_timestamp()
    
    conversation = Conversation(
        id=conversation_id,
        user_id=user_id,
        messages=[],
        created_at=now,
        updated_at=now
    )
    
    conversations[conversation_id] = conversation
    return conversation

@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a conversation by ID"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations[conversation_id]

@app.get("/api/users/{user_id}/conversations", response_model=List[Conversation])
async def get_user_conversations(user_id: str):
    """Get all conversations for a user"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_conversations = [conv for conv in conversations.values() if conv.user_id == user_id]
    return user_conversations

# User endpoints
@app.post("/api/users", response_model=User)
async def create_user(name: str, email: Optional[str] = None):
    """Create a new user"""
    user_id = str(uuid.uuid4())
    now = get_timestamp()
    
    user = User(
        id=user_id,
        name=name,
        email=email,
        created_at=now
    )
    
    users[user_id] = user
    return user

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get a user by ID"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    return users[user_id]

# Emotion analysis endpoint
@app.post("/api/analyze/emotion")
async def analyze_text_emotion(text: str):
    """Analyze the emotion of a given text"""
    emotion = analyze_emotion(text)
    return {"emotion": emotion, "text": text}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": get_timestamp()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
