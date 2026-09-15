import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Routes
import downloadRoutes from './routes/downloadRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import recommendationsRoutes from './routes/recommendationsRoutes.js';
import configRoutes from './routes/configRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import lyricsRoutes from './routes/lyricsRoutes.js';

import fs from 'fs';
import path from 'path';

const app = express();

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS middleware allowing localhost, null origin (file://) and private network access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.headers['access-control-request-private-network']) {
    res.header('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting (generous in desktop/local mode)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.DESKTOP_MODE ? 50000 : 2000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Ramona Music Backend is running' });
});

// API Routes
app.use('/api/download', downloadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/lyrics', lyricsRoutes);

// Optional: Serve static web frontend if WEB_DIST_PATH is provided
const webDistPath = process.env.WEB_DIST_PATH;
if (webDistPath && fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
