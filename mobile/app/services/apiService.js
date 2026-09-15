import axios from 'axios';

// YouTube Music internal API (no auth required, works from React Native)
const YTMUSIC_API = 'https://music.youtube.com/youtubei/v1';
const YTMUSIC_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20230213.01.00',
    hl: 'en'
  }
};

const ytMusicPost = async (endpoint, body) => {
  const response = await fetch(`${YTMUSIC_API}/${endpoint}?prettyPrint=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
      'Origin': 'https://music.youtube.com',
      'Referer': 'https://music.youtube.com/',
      'X-YouTube-Client-Name': '67',
      'X-YouTube-Client-Version': '1.20230213.01.00'
    },
    body: JSON.stringify({ context: YTMUSIC_CONTEXT, ...body })
  });

  if (!response.ok) throw new Error(`YouTube Music API error: ${response.status}`);
  return response.json();
};

const parseListItem = (item) => {
  try {
    const r = item.musicResponsiveListItemRenderer;
    if (!r) return null;

    const cols = r.flexColumns || [];
    const title = cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
    const secondCol = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
    const artist = secondCol[0]?.text || '';

    // videoId lives in the title run's watchEndpoint
    const videoId = cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
      ?.navigationEndpoint?.watchEndpoint?.videoId;

    if (!videoId || !title) return null;

    const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
    const thumbnail = thumbs[thumbs.length - 1]?.url || '';

    return { id: videoId, title, artist, thumbnail };
  } catch {
    return null;
  }
};

export const searchTracks = async (query) => {
  console.log('--- nativeSearch INIT ---', query);
  try {
    const data = await ytMusicPost('search', {
      query,
      params: 'EgWKAQIIAWoKEAMQBBAJEAoQBQ=='
    });
    
    console.log('--- ytMusicPost SUCCESS --- keys:', Object.keys(data));

    const items = [];
    const walk = (obj) => {
      if (!obj) return;
      if (typeof obj !== 'object') return;
      if (obj.musicResponsiveListItemRenderer) {
        const parsed = parseListItem(obj);
        if (parsed) items.push(parsed);
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach(walk);
      } else {
        Object.values(obj).forEach(walk);
      }
    };
    walk(data);

    console.log('--- nativeSearch parsed items ---', items.length);

    if (items.length > 0) {
      return { tracks: items };
    }
  } catch (err) {
    console.error('--- YouTube Music search failed ---', err.message, err);
  }

  return { tracks: [] };
};

export const getRecommendations = async () => {
  try {
    // Home feed
    const data = await ytMusicPost('browse', {
      browseId: 'FEmusic_home'
    });

    const items = [];
    const walk = (obj) => {
      if (!obj) return;
      if (typeof obj !== 'object') return;
      if (obj.musicTwoRowItemRenderer) {
        try {
          const r = obj.musicTwoRowItemRenderer;
          const title = r.title?.runs?.[0]?.text || '';
          const videoId = r.navigationEndpoint?.watchEndpoint?.videoId
            || r.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
          if (!videoId || !title) return;
          const thumbs = r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          const thumbnail = thumbs[thumbs.length - 1]?.url || '';
          const subtitle = r.subtitle?.runs?.map(r => r.text).join('') || '';
          items.push({ id: videoId, title, artist: subtitle, thumbnail });
        } catch { }
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach(walk);
      } else {
        Object.values(obj).forEach(walk);
      }
    };
    walk(data);

    if (items.length > 0) {
      return { tracks: items.slice(0, 20) };
    }
  } catch (err) {
    console.warn('YouTube Music home failed, falling back to search:', err.message);
  }

  // Fallback to searching popular music
  return searchTracks('top music 2024');
};

export const getLibraryTracks = async () => {
  return [];
};
