import axios from 'axios';

const hostname = window.location.hostname || '127.0.0.1';
export const API_URL = `http://${hostname}:3001/api`;

const api = axios.create({
  baseURL: API_URL,
});

let INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.f5.si',
  'https://yt.chocolatemoo53.com',
  'https://invidious.tiekoetter.com',
  'https://vid.puffyan.us',
  'https://invidious.jing.rocks',
  'https://inv.tux.pizza'
];

let currentInstanceIndex = 0;
let instancesFetched = false;

const fetchActiveInstances = async () => {
  try {
    const response = await axios.get('https://api.invidious.io/instances.json', { timeout: 5000 });
    const activeInstances = response.data
      .map(item => item[1])
      .filter(info => info && info.type === 'https' && info.uri)
      .map(info => info.uri);
    
    if (activeInstances.length > 0) {
      INVIDIOUS_INSTANCES = [...new Set([...activeInstances, ...INVIDIOUS_INSTANCES])];
      currentInstanceIndex = 0;
    }
  } catch (error) {
    console.warn('Failed to fetch dynamic instances', error.message);
  } finally {
    instancesFetched = true;
  }
};

const fetchInvidious = async (endpoint) => {
  let attempts = 0;
  let maxAttempts = Math.min(INVIDIOUS_INSTANCES.length, 4); // Limitar a 4 intentos para no bloquear
  
  while (attempts < maxAttempts) {
    const baseUrl = INVIDIOUS_INSTANCES[currentInstanceIndex];
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, { timeout: 4000 });
      return { data: response.data, baseUrl };
    } catch (error) {
      console.warn(`Instancia ${baseUrl} falló, intentando otra...`);
      currentInstanceIndex = (currentInstanceIndex + 1) % INVIDIOUS_INSTANCES.length;
      attempts++;
      
      if (attempts >= maxAttempts && !instancesFetched) {
        await fetchActiveInstances();
        if (instancesFetched) {
          attempts = 0;
          maxAttempts = Math.min(INVIDIOUS_INSTANCES.length, 4);
        }
      }
    }
  }
  throw new Error('Todas las instancias de Invidious fallaron');
};

// Fallback: scrape YouTube directly (works when Invidious is down)
const scrapeYouTube = async (query) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(`https://m.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    
    const startStr = 'ytInitialData = ';
    const startIndex = html.indexOf(startStr);
    if (startIndex === -1) throw new Error('No ytInitialData found');
    
    const jsonStart = startIndex + startStr.length;
    const endStr = ';</script>';
    const endIndex = html.indexOf(endStr, jsonStart);
    if (endIndex === -1) throw new Error('No end of ytInitialData');
    
    const data = JSON.parse(html.slice(jsonStart, endIndex));
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents || [];
    
    return contents
      .filter(item => item.videoRenderer)
      .map(item => {
        const v = item.videoRenderer;
        return {
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || 'Unknown Title',
          artist: v.ownerText?.runs?.[0]?.text || 'Unknown Artist',
          thumbnail: v.thumbnail?.thumbnails?.[0]?.url || null
        };
      });
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn('YouTube scraping failed:', e.message);
    return [];
  }
};

// Native bridge resolvers for search
let searchResolvers = {};

if (typeof window !== 'undefined') {
  window.addEventListener('nativeMessage', (e) => {
    const data = e.detail;
    if (data && (data.type === 'SEARCH_RESPONSE' || data.type === 'RECOMMENDATIONS_RESPONSE')) {
      if (searchResolvers[data.queryId]) {
        searchResolvers[data.queryId](data.results);
        delete searchResolvers[data.queryId];
      }
    } else if (data && data.type === 'LIBRARY_RESPONSE') {
      if (searchResolvers[data.queryId]) {
        searchResolvers[data.queryId]({ tracks: data.tracks || [] });
        delete searchResolvers[data.queryId];
      }
    }
  });
}

const mobileSearch = async (query) => {
  return new Promise((resolve) => {
    const queryId = Date.now().toString() + Math.random();
    searchResolvers[queryId] = resolve;
    
    setTimeout(() => {
      if (searchResolvers[queryId]) {
        resolve([]);
        delete searchResolvers[queryId];
      }
    }, 15000);
    
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SEARCH_TRACKS',
        queryId,
        query
      }));
    } else {
      resolve([]);
    }
  });
};

const mobileRecommendations = async () => {
  return new Promise((resolve) => {
    const queryId = Date.now().toString() + Math.random();
    searchResolvers[queryId] = resolve;
    
    setTimeout(() => {
      if (searchResolvers[queryId]) {
        resolve([]);
        delete searchResolvers[queryId];
      }
    }, 15000);
    
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'GET_RECOMMENDATIONS',
        queryId
      }));
    } else {
      resolve([]);
    }
  });
};

export const searchTracks = async (query, source = 'youtube', startIndex = 1, limit = 10) => {
  if (window.isMobileNative) {
    return await mobileSearch(query);
  }
  const response = await api.get(`/search?q=${encodeURIComponent(query)}&source=${source}&startIndex=${startIndex}&limit=${limit}`);
  return response.data;
};

export const searchCover = async (query, artist = '') => {
  if (window.isMobileNative) return { covers: [] };
  let url = `/search/cover?q=${encodeURIComponent(query)}`;
  if (artist) url += `&artist=${encodeURIComponent(artist)}`;
  const response = await api.get(url);
  return response.data;
};

export const getRecommendations = async () => {
  if (window.isMobileNative) {
    return await mobileRecommendations();
  }
  const response = await api.get('/recommendations');
  return response.data;
};

export const getLyrics = async (title, artist) => {
  if (window.isMobileNative) {
    try {
      const response = await axios.get(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`, { timeout: 5000 });
      if (response.data && response.data.length > 0) {
        const best = response.data[0];
        return {
          syncedLyrics: best.syncedLyrics || null,
          plainLyrics: best.plainLyrics || null
        };
      }
    } catch (e) {
      console.warn('LRCLIB lyrics fetch failed', e.message);
    }
    return null;
  }
  const response = await api.get(`/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
  return response.data;
};

export const translateLyrics = async (text) => {
  if (window.isMobileNative) {
    return { translatedText: '' };
  }
  const response = await api.post('/lyrics/translate', { text });
  return response.data;
};

export const backupTrack = async (track) => {
  if (window.isMobileNative) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DOWNLOAD_TRACK',
        track: {
          id: track.id,
          title: track.title,
          artist: track.artist || track.channel || 'Unknown Artist',
          thumbnail: track.thumbnail
        }
      }));
    }
    return { success: true, message: 'Download delegated to native' };
  }
  const response = await api.post('/backup', {
    trackId: track.id,
    title: track.title,
    artist: track.artist || track.channel || 'Unknown Artist'
  });
  return response.data;
};

export const getLibraryTracks = async () => {
  if (window.isMobileNative) {
    return new Promise((resolve) => {
      const queryId = Date.now().toString() + Math.random();
      searchResolvers[queryId] = resolve;
      
      setTimeout(() => {
        if (searchResolvers[queryId]) {
          resolve({ tracks: [] });
          delete searchResolvers[queryId];
        }
      }, 10000);
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GET_LIBRARY',
          queryId
        }));
      } else {
        resolve({ tracks: [] });
      }
    });
  }
  const response = await api.get('/backup/library');
  return response.data;
};

export const getBackupStatus = async () => {
  if (window.isMobileNative) {
    return { activeDownloads: [] };
  }
  const response = await api.get('/backup/status');
  return response.data;
};

export const deleteTracks = async (filePaths) => {
  if (window.isMobileNative) {
    return { success: true };
  }
  const response = await axios.delete(`${API_URL}/backup`, {
    data: { filePaths }
  });
  return response.data;
};

export const updateMetadata = async (data) => {
  if (window.isMobileNative) {
    return { success: true };
  }
  const response = await api.post('/backup/metadata', data);
  return response.data;
};

export const getConfig = async () => {
  if (window.isMobileNative) {
    return {};
  }
  const response = await api.get('/config');
  return response.data;
};

export const saveConfig = async (config) => {
  if (window.isMobileNative) {
    return { config };
  }
  const response = await api.post('/config', config);
  return response.data;
};

export default api;
