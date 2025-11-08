const { Pool } = require('pg');
const express = require('express');
const router = express.Router();

// Database configuration - replace with your NeonDB connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@your-neon-host:5432/your-db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database table if it doesn't exist
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emotion_summaries (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        emotion_timeline JSONB NOT NULL,
        empathy_score FLOAT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id)
      );
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database on startup
initDb().catch(console.error);

// Middleware to check Safe Mode
const safeModeMiddleware = (req, res, next) => {
  if (process.env.SAFE_MODE === 'true') {
    return res.status(200).json({
      status: 'safe_mode',
      message: 'Running in safe mode - no database writes performed'
    });
  }
  next();
};

// POST /emotion-summary
router.post('/emotion-summary', safeModeMiddleware, async (req, res) => {
  try {
    const { session_id, emotion_timeline, empathy_score } = req.body;

    if (!session_id || !emotion_timeline || empathy_score === undefined) {
      return res.status(400).json({
        error: 'session_id, emotion_timeline, and empathy_score are required'
      });
    }

    // Sanitize and validate input
    const sanitizedTimeline = {
      emotions: Array.isArray(emotion_timeline.emotions) 
        ? emotion_timeline.emotions.map(e => ({
            emotion: String(e.emotion || ''),
            confidence: parseFloat(e.confidence || 0),
            timestamp: new Date(e.timestamp || Date.now()).toISOString()
          }))
        : []
    };

    const result = await pool.query(
      `INSERT INTO emotion_summaries 
       (session_id, emotion_timeline, empathy_score)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id) 
       DO UPDATE SET 
         emotion_timeline = EXCLUDED.emotion_timeline,
         empathy_score = EXCLUDED.empathy_score
       RETURNING *`,
      [session_id, sanitizedTimeline, parseFloat(empathy_score)]
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving emotion summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /dashboard/:session_id
router.get('/dashboard/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const result = await pool.query(
      'SELECT emotion_timeline, empathy_score FROM emotion_summaries WHERE session_id = $1',
      [session_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    const { emotion_timeline, empathy_score } = result.rows[0];
    
    // Calculate summary statistics
    const emotions = emotion_timeline.emotions || [];
    const emotionCount = emotions.reduce((acc, { emotion }) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        session_id,
        emotion_summary: {
          total_emotions: emotions.length,
          emotion_distribution: emotionCount,
          average_empathy: empathy_score,
          timeline: emotion_timeline
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
