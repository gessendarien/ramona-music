import express from 'express';
import * as searchController from '../controllers/searchController.js';
import * as searchStreamController from '../controllers/searchStreamController.js';

const router = express.Router();

// GET /api/search/stream?q=query
router.get('/stream', searchStreamController.streamSearch);

// GET /api/search?q=query
router.get('/', searchController.search);

// GET /api/search/info?url=youtube_url
router.get('/info', searchController.getInfo);

// GET /api/search/cover?url=youtube_url
router.get('/cover', searchController.searchCover);

export default router;
