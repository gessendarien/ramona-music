import express from 'express';
import { backupTrack, getLibraryTracks, getBackupStatus, updateMetadata, streamTrack, deleteTracks } from '../controllers/backupController.js';

const router = express.Router();

router.post('/', backupTrack);
router.delete('/', deleteTracks);
router.get('/library', getLibraryTracks);
router.get('/status', getBackupStatus);
router.post('/metadata', updateMetadata);
router.get('/stream/audio.mp3', streamTrack);

export default router;
