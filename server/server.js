import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes        from './routes/authRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import superadminRoutes  from './routes/superadminRoutes.js';
import hodRoutes         from './routes/hodRoutes.js';
import responseRoutes    from './routes/responseRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => res.json({ status: 'OK', message: 'Invertis Feedback System API v2' }));

app.use('/api/auth',        authRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/superadmin',  superadminRoutes);
app.use('/api/hod',         hodRoutes);
app.use('/api/student',     responseRoutes);

// Analytics endpoint for super_admin (proxy to responseController)
import { getAnalytics } from './controllers/responseController.js';
import { authenticate, authorize } from './middleware/auth.js';
app.get('/api/responses/analytics', authenticate, authorize('super_admin', 'hod'), getAnalytics);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
}

const startServer = async () => {
  try {
    await initDb();
    console.log('Database initialized successfully.');
    app.listen(PORT, () => console.log(`Invertis Feedback System running at http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
