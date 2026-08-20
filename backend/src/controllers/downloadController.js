import * as downloadService from '../services/downloadService.js';

export const startDownload = async (req, res) => {
  try {
    const { url, title, artist } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const downloadInfo = downloadService.downloadTrack(url, title, artist);
    res.status(202).json(downloadInfo);
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
};

export const listDownloads = (req, res) => {
  const downloads = downloadService.getRecentDownloads();
  res.json(downloads);
};

export const getDownloadStatus = (req, res) => {
  const { id } = req.params;
  const status = downloadService.getDownloadStatus(id);
  if (!status) {
    return res.status(404).json({ error: 'Download not found' });
  }
  res.json(status);
};

export const cancelDownload = (req, res) => {
  // Mock cancellation
  res.status(200).json({ message: 'Download cancelled' });
};
