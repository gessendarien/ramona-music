import ytsr from 'youtube-search-api';
import youtubedl from 'youtube-dl-exec';

export const searchYouTube = async (query, source = 'youtube', limit = 20) => {
  const isUrl = /^https?:\/\/(www\.youtube\.com|youtu\.be)\//.test(query);
  const searchQuery = source === 'ytmusic' && !isUrl ? `${query} audio` : query;
  
  try {
    if (isUrl) {
      const info = await youtubedl(query, { dumpSingleJson: true, flatPlaylist: true, noWarnings: true });
      if (info._type === 'playlist' && info.entries) {
        return info.entries.map(item => ({
          id: item.id,
          title: item.title,
          channel: item.uploader || item.channel || info.uploader || 'Unknown',
          duration: item.duration_string || (item.duration ? new Date(item.duration * 1000).toISOString().substr(14, 5) : 'Unknown'),
          thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          url: item.url || `https://www.youtube.com/watch?v=${item.id}`
        }));
      } else {
        return [{
          id: info.id,
          title: info.title,
          channel: info.uploader || info.channel || 'Unknown',
          duration: info.duration_string || (info.duration ? new Date(info.duration * 1000).toISOString().substr(14, 5) : 'Unknown'),
          thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
          url: info.webpage_url || query
        }];
      }
    } else {
      const searchPrefix = source === 'ytmusic' ? 'ytmsearch' : 'ytsearch';
      const finalQuery = source === 'ytmusic' && !isUrl ? query : searchQuery; // Don't append "audio" to ytmsearch
      const result = await youtubedl(`${searchPrefix}${limit}:${finalQuery}`, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noWarnings: true
      });
      
      if (!result || !result.entries) return [];

      return result.entries.map(item => ({
        id: item.id,
        title: item.title,
        channel: item.uploader || item.channel || 'Unknown',
        duration: item.duration_string || (item.duration ? new Date(item.duration * 1000).toISOString().substr(14, 5) : 'Unknown'),
        thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        url: item.url || `https://www.youtube.com/watch?v=${item.id}`
      }));
    }
  } catch (error) {
    console.warn("yt-dlp search error, attempting ytsr fallback:", error.message);
    try {
      const fn = ytsr.GetListByKeyword || ytsr.default?.GetListByKeyword;
      if (fn && !isUrl) {
        const res = await fn(query, false, limit);
        if (res && res.items) {
          return res.items
            .filter(item => item.id && (item.type === 'video' || item.type === undefined))
            .map(item => ({
              id: item.id,
              title: item.title,
              channel: item.channelTitle || 'Unknown',
              duration: item.length?.simpleText || 'Unknown',
              thumbnail: item.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${item.id}`
            }));
        }
      }
    } catch (fallbackErr) {
      console.error("Fallback search failed:", fallbackErr.message);
    }
    return [];
  }
};

export const getVideoInfo = async (url) => {
  try {
    const info = await youtubedl(url, { dumpSingleJson: true, noWarnings: true });
    return {
      title: info.title,
      author: info.uploader,
      thumbnail: info.thumbnail,
      lengthSeconds: info.duration,
    };
  } catch (error) {
    console.error("Error fetching video info via yt-dlp:", error.message);
    throw error;
  }
};
