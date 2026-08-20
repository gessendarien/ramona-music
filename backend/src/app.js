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

const app = express();

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint (mentioned in QUICK_START.md)
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
