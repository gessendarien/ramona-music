import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import sanitize from 'sanitize-filename';
import NodeID3 from 'node-id3';
import { exec } from 'child_process';

const downloads = new Map();
const DOWNLOAD_DIR = process.env.MUSIC_PATH || path.join(process.cwd(), 'downloads');

// Ensure directory exists
fs.ensureDirSync(DOWNLOAD_DIR);

export const downloadTrack = (url, title, artist) => {
  const id = uuidv4();
  throw new Error("downloadTrack is deprecated. Use backupTrack instead.");
};

export const getDownloadStatus = (id) => {
  return downloads.get(id);
};

export const getRecentDownloads = () => {
  return Array.from(downloads.values()).sort((a, b) => b.id.localeCompare(a.id));
};
