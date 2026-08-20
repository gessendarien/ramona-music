import youtubedl from 'youtube-dl-exec';
import fs from 'fs-extra';
import path from 'path';
import sanitize from 'sanitize-filename';
import nodeID3 from 'node-id3';
import * as mm from 'music-metadata';
import axios from 'axios';

const configFilePath = path.join(process.cwd(), 'ramona-config.json');

export const activeDownloads = new Map();

const getBackupPath = async () => {
  if (await fs.pathExists(configFilePath)) {
    const config = await fs.readJson(configFilePath);
    return config.backupPath || path.join(process.cwd(), 'downloads');
  }
  return path.join(process.cwd(), 'downloads');
};

// Build yt-dlp options, optionally adding cookies file if configured
const getYtdlpOptions = async (baseOptions) => {
  const opts = { ...baseOptions };
  try {
    if (await fs.pathExists(configFilePath)) {
      const config = await fs.readJson(configFilePath);
      // If user configured a cookies.txt path, use it
      if (config.cookiesFile && await fs.pathExists(config.cookiesFile)) {
        opts.cookies = config.cookiesFile;
      }
    }
  } catch (e) {
    // Ignore config read errors
  }
  return opts;
};

export const backupTrack = async (req, res) => {
  const { trackId, title, artist } = req.body;

  if (!trackId) {
    return res.status(400).json({ error: 'trackId is required' });
  }

  try {
    const backupDir = await getBackupPath();
    await fs.ensureDir(backupDir);

    const safeTitle = sanitize(title || trackId);
    const safeArtist = sanitize(artist || 'Unknown Artist');
    const outputPathTemplate = path.join(backupDir, `${safeArtist} - ${safeTitle}.%(ext)s`);
    const expectedPathMP3 = path.join(backupDir, `${safeArtist} - ${safeTitle}.mp3`);

    if (activeDownloads.has(trackId)) {
      return res.status(409).json({ error: 'Already downloading this track' });
    }

    const url = `https://www.youtube.com/watch?v=${trackId}`;

    res.json({ success: true, message: 'Backup started', filename: `${safeArtist} - ${safeTitle}.mp3` });

    activeDownloads.set(trackId, { trackId, title, artist, status: 'downloading', progress: 0 });

    const dlOptions = await getYtdlpOptions({
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      output: outputPathTemplate,
      noPlaylist: true,
      embedThumbnail: true,
      extractorArgs: 'youtube:player-client=ios,android'
    });

    const subprocess = youtubedl.exec(url, dlOptions);

    subprocess.stdout.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/\[download\]\s+([\d\.]+)%/);
      if (match) {
        const progress = parseFloat(match[1]);
        const currentData = activeDownloads.get(trackId);
        if (currentData) {
          activeDownloads.set(trackId, { ...currentData, progress: Math.round(progress) });
        }
      }
    });

    subprocess.then(() => {
      console.log(`Backup completed for ${trackId}`);
      activeDownloads.delete(trackId);
      
      // Write ID3 tags immediately after download to save title, artist, and original YouTube ID
      const expectedPath = path.join(backupDir, `${safeArtist} - ${safeTitle}.mp3`);
      setTimeout(() => {
        try {
          if (fs.existsSync(expectedPath)) {
            const existingTags = nodeID3.read(expectedPath) || {};
            const userDefinedText = existingTags.userDefinedText || [];
            // Remove any existing youtube_id tag if present
            const filteredUDT = userDefinedText.filter(tag => tag.description !== 'youtube_id');
            filteredUDT.push({ description: 'youtube_id', value: trackId });

            const updatedTags = {
              ...existingTags,
              title: title || safeTitle,
              artist: artist || 'Unknown Artist',
              userDefinedText: filteredUDT
            };
            nodeID3.update(updatedTags, expectedPath);
          }
        } catch (e) {
          console.error(`Failed to write ID3 tags for ${trackId}:`, e);
        }
      }, 500); // Small delay to ensure yt-dlp/ffmpeg completely released the file
    }).catch((err) => {
      console.error(`Backup error for ${trackId}:`, err.message);
      activeDownloads.delete(trackId);
      // Try to clean up
      const expectedPath = path.join(backupDir, `${safeArtist} - ${safeTitle}.mp3`);
      fs.remove(expectedPath).catch(e => console.error(e));
    });

  } catch (error) {
    console.error('Backup controller error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start backup process' });
    }
  }
};

export const getLibraryTracks = async (req, res) => {
  try {
    const backupDir = await getBackupPath();
    if (!(await fs.pathExists(backupDir))) {
      return res.json({ tracks: [] });
    }

    const files = await fs.readdir(backupDir);
    const audioFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.mp3') || f.endsWith('.m4a'));

    const protocol = req.protocol;
    const host = req.get('host');

    const tracks = await Promise.all(audioFiles.map(async (file, index) => {
      const filePath = path.join(backupDir, file);
      // Basic parsing of "Artist - Title.ext" as fallback
      const nameWithoutExt = path.parse(file).name;
      const parts = nameWithoutExt.split(' - ');
      let artist = parts.length > 1 ? parts[0] : 'Unknown Artist';
      let title = parts.length > 1 ? parts.slice(1).join(' - ') : nameWithoutExt;
      let album = '';
      
      let thumbnail = 'https://via.placeholder.com/150/0e0e0e/ffb3ae?text=Local';
      let durationStr = '--:--';
      let originalId = null;

      try {
        const metadata = await mm.parseFile(filePath);
        if (metadata.format && metadata.format.duration) {
          const totalSeconds = Math.floor(metadata.format.duration);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      } catch (e) {
        // Ignore duration parsing errors
      }

      // Try to read ID3 tags
      try {
        const tags = nodeID3.read(filePath);
        if (tags) {
          if (tags.title) title = tags.title;
          if (tags.artist) artist = tags.artist;
          if (tags.album) album = tags.album;
          if (tags.image && tags.image.imageBuffer) {
            const base64Image = tags.image.imageBuffer.toString('base64');
            const mimeType = tags.image.mime || 'image/jpeg';
            thumbnail = `data:${mimeType};base64,${base64Image}`;
          }
          if (tags.userDefinedText) {
            const ytTag = tags.userDefinedText.find(tag => tag.description === 'youtube_id');
            if (ytTag) originalId = ytTag.value;
          }
        }
      } catch (e) {
        // Ignore tag reading errors
      }

      return {
        id: `library-${index}`,
        originalId,
        title,
        artist,
        album,
        duration: durationStr,
        thumbnail,
        isLocal: true,
        filePath,
        url: `${protocol}://${host}/api/backup/stream/audio.mp3?file=${encodeURIComponent(file)}`
      };
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Error reading library:', error);
    res.status(500).json({ error: 'Failed to read library' });
  }
};

export const getBackupStatus = (req, res) => {
  res.json({ activeDownloads: Array.from(activeDownloads.values()) });
};

export const streamTrack = async (req, res) => {
  try {
    const { file } = req.query;
    if (!file) return res.status(400).json({ error: 'File parameter is required' });
    
    const backupDir = await getBackupPath();
    const filePath = path.join(backupDir, file);
    
    // Prevent directory traversal attacks
    if (!filePath.startsWith(backupDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error streaming track:', error);
    res.status(500).json({ error: 'Failed to stream track' });
  }
};

export const updateMetadata = async (req, res) => {
  const { filePath, title, artist, album, coverUrl } = req.body;
  if (!filePath || !(await fs.pathExists(filePath))) {
    return res.status(400).json({ error: 'File not found' });
  }

  try {
    const tags = {};
    if (title) tags.title = title;
    if (artist) tags.artist = artist;
    if (album) tags.album = album;

    if (coverUrl) {
      const response = await axios.get(coverUrl, { responseType: 'arraybuffer' });
      tags.image = {
        mime: response.headers['content-type'] || 'image/jpeg',
        type: { id: 3, name: 'front cover' },
        description: 'Cover',
        imageBuffer: Buffer.from(response.data)
      };
    }

    const success = nodeID3.update(tags, filePath);
    
    if (success) {
      // Optionally rename file if artist/title changed
      try {
        const dir = path.dirname(filePath);
        const oldExt = path.extname(filePath);
        // We'll read the final tags to construct the new filename
        const currentTags = nodeID3.read(filePath);
        const finalArtist = currentTags.artist || artist || 'Unknown Artist';
        const finalTitle = currentTags.title || title || 'Unknown Title';
        const newFilename = `${sanitize(finalArtist)} - ${sanitize(finalTitle)}${oldExt}`;
        const newPath = path.join(dir, newFilename);
        
        if (newPath !== filePath && !(await fs.pathExists(newPath))) {
          await fs.rename(filePath, newPath);
          return res.json({ success: true, newFilePath: newPath });
        }
      } catch (renameErr) {
        console.error('Failed to rename file after tagging', renameErr);
      }
      
      res.json({ success: true, newFilePath: filePath });
    } else {
      res.status(500).json({ error: 'Failed to write tags' });
    }
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ error: 'Internal server error while updating metadata' });
  }
};
