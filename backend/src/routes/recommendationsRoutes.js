import express from 'express';
import * as recommendationsController from '../controllers/recommendationsController.js';

const router = express.Router();

router.get('/', recommendationsController.getRecommendations);

export default router;
