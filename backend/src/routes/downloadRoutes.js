import express from 'express';
import * as downloadController from '../controllers/downloadController.js';

const router = express.Router();

router.post('/', downloadController.startDownload);
router.get('/', downloadController.listDownloads);
router.get('/:id', downloadController.getDownloadStatus);
router.delete('/:id', downloadController.cancelDownload);

export default router;
