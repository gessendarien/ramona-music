import express from 'express';
import { getConfig, saveConfig } from '../controllers/configController.js';

const router = express.Router();

router.get('/', getConfig);
router.post('/', saveConfig);

export default router;
