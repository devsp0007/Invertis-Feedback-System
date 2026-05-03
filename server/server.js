import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

import authRoutes from './routes/authRoutes.js';
import tlfqRoutes from './routes/tlfqRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import syncRoutes from './routes/syncRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up base route for server heartbeat
app.get('/api', (req, res) => {
  res.json({ status: 'OK', message: 'TLFQ System Backend is fully operational!' });
});

// Set up core routes
app.use('/api/auth', authRoutes);
app.use('/api/tlfq', tlfqRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/sync', syncRoutes);


// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
}

const startServer = async () => {
  try {
    await initDb();
    console.log('Database initialized successfully with schema and seed data.');
    
    app.listen(PORT, () => {
      console.log(`TLFQ System Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize or start server:', err);
    process.exit(1);
  }
};

startServer();
