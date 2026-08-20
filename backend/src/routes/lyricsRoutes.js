import express from 'express';
import { getLyrics, translateLyrics } from '../controllers/lyricsController.js';

const router = express.Router();

router.get('/', getLyrics);
router.post('/translate', translateLyrics);

export default router;
