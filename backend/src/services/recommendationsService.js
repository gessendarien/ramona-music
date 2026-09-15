import fs from 'fs-extra';
import path from 'path';
import NodeID3 from 'node-id3';
import axios from 'axios';
import * as searchService from './searchService.js';

let cachedRecommendations = null;
let lastCacheTime = 0;

export const fetchRecommendations = async (req) => {
  // Return cached recommendations if they are less than 1 hour old
  if (cachedRecommendations && (Date.now() - lastCacheTime < 3600000)) {
    return cachedRecommendations;
  }

  const configDir = process.env.RAMONA_DATA_DIR || process.cwd();
  const configFilePath = path.join(configDir, 'ramona-config.json');
  let backupDir = process.env.MUSIC_PATH || path.join(process.cwd(), 'downloads');
  if (await fs.pathExists(configFilePath)) {
    try {
      const config = await fs.readJson(configFilePath);
      if (config.backupPath) backupDir = config.backupPath;
    } catch (e) {}
  }

  let downloadedArtists = [];
  let downloadedTitles = [];
  if (await fs.pathExists(backupDir)) {
    try {
      const files = await fs.readdir(backupDir);
      const audioFiles = files.filter(f => f.endsWith('.mp3') || f.endsWith('.m4a'));
      
      for (const file of audioFiles) {
        try {
          const filePath = path.join(backupDir, file);
          const tags = NodeID3.read(filePath);
          if (tags && tags.artist) {
            downloadedArtists.push(tags.artist.split(',')[0].trim());
            if (tags.title) downloadedTitles.push(tags.title.toLowerCase().trim());
          } else {
            const parts = path.parse(file).name.split(' - ');
            if (parts.length > 1) {
              downloadedArtists.push(parts[0].trim());
              downloadedTitles.push(parts[1].toLowerCase().trim());
            }
          }
        } catch (e) {
          // Ignore individual file parse errors
        }
      }
    } catch (e) {
      // Ignore directory read errors
    }
  }

  // Filter and deduplicate artists
  downloadedArtists = [...new Set(downloadedArtists.filter(a => a && a.toLowerCase() !== 'unknown artist'))];

  // If no downloads found in library, return empty array so Today prompts the user to download songs
  if (downloadedArtists.length === 0) {
    return [];
  }

  // Pick a random artist from the user's downloads to base recommendations on
  const seedArtist = downloadedArtists[Math.floor(Math.random() * downloadedArtists.length)];

  try {
    // 1. Search YouTube for similar artists and songs
    const ytQuery = `canciones parecidas a ${seedArtist} audio`;
    const ytsRes = await searchService.searchYouTube(ytQuery, 'youtube', 40);
    
    // Filter out long mixes, compilations (keep < 10 mins), and already downloaded songs
    const validTracks = ytsRes.filter(v => {
      if (!v.duration || v.duration.length > 5 || v.title.toLowerCase().includes('completo')) return false;
      const titleLower = v.title.toLowerCase();
      // Emphasize new songs by removing exactly downloaded ones
      for (const downloadedTitle of downloadedTitles) {
        if (downloadedTitle.length > 3 && titleLower.includes(downloadedTitle)) {
          return false;
        }
      }
      return true;
    });
    
    // Shuffle and pick 20
    const shuffled = validTracks.sort(() => 0.5 - Math.random()).slice(0, 20);

    // 2. Map them directly to recommendations using YouTube metadata
    const recommendations = shuffled.map(video => ({
      id: video.id,
      title: video.title,
      artist: video.channel,
      duration: video.duration,
      thumbnail: video.thumbnail,
      url: video.url 
    }));

    if (recommendations.length > 0) {
      cachedRecommendations = recommendations;
      lastCacheTime = Date.now();
      return recommendations;
    }
  } catch (error) {
    console.error("Error fetching recommendations from APIs:", error.message);
  }

  // Fallback if APIs fail
  return [];
};
