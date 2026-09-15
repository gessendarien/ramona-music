import { spawn } from 'child_process';
import ytsr from 'youtube-search-api';

const fallbackSearch = async (q, limit = 20) => {
  try {
    const fn = ytsr.GetListByKeyword || ytsr.default?.GetListByKeyword;
    if (!fn) return [];
    const res = await fn(q, false, limit);
    if (!res || !res.items) return [];
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
  } catch (err) {
    console.error('Fallback search error via youtube-search-api:', err.message);
    return [];
  }
};

export const streamSearch = async (req, res) => {
  const { q, startIndex = 1, limit = 10 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Private-Network': 'true'
  });
  res.flushHeaders();

  const isUrl = /^https?:\/\/(www\.youtube\.com|youtu\.be)\//.test(q);
  const target = isUrl ? q : `ytsearch20:${q}`;

  const args = [
    target,
    '--dump-json',
    '--flat-playlist',
    '--no-warnings'
  ];

  if (isUrl) {
    args.push('--playlist-items', `${startIndex}-${parseInt(startIndex) + parseInt(limit) - 1}`);
  }

  let itemsSent = 0;
  let isClosed = false;

  const closeStream = () => {
    if (!isClosed) {
      isClosed = true;
      try {
        res.write('event: end\ndata: {}\n\n');
        res.end();
      } catch (e) {}
    }
  };

  req.on('close', () => {
    isClosed = true;
  });

  try {
    const ytDlp = spawn('yt-dlp', args);

    let buffer = '';

    ytDlp.stdout.on('data', (data) => {
      if (isClosed) return;
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.trim()) {
          try {
            const item = JSON.parse(line);
            const mappedItem = {
              id: item.id,
              title: item.title,
              channel: item.uploader || item.channel || 'Unknown',
              duration: item.duration_string || (item.duration ? new Date(item.duration * 1000).toISOString().substr(14, 5) : 'Unknown'),
              thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              url: item.url || `https://www.youtube.com/watch?v=${item.id}`
            };
            res.write(`data: ${JSON.stringify(mappedItem)}\n\n`);
            itemsSent++;
          } catch (err) {
            console.error("Failed to parse yt-dlp json line", err);
          }
        }
      }
    });

    ytDlp.stderr.on('data', (data) => {
      // Ignorar advertencias menores
    });

    ytDlp.on('error', async (err) => {
      console.warn('yt-dlp spawn failed, using fallback search:', err.message);
      if (!isClosed && !isUrl && itemsSent === 0) {
        const fallbackItems = await fallbackSearch(q, 20);
        for (const item of fallbackItems) {
          if (isClosed) break;
          res.write(`data: ${JSON.stringify(item)}\n\n`);
          itemsSent++;
        }
      }
      closeStream();
    });

    ytDlp.on('close', async (code) => {
      // Si yt-dlp no devolvió nada o falló con código de error, intentar fallback
      if (!isClosed && !isUrl && itemsSent === 0) {
        const fallbackItems = await fallbackSearch(q, 20);
        for (const item of fallbackItems) {
          if (isClosed) break;
          res.write(`data: ${JSON.stringify(item)}\n\n`);
          itemsSent++;
        }
      }
      closeStream();
    });

    req.on('close', () => {
      try {
        ytDlp.kill();
      } catch (e) {}
    });

  } catch (err) {
    console.warn('Error starting yt-dlp process, falling back to ytsr:', err.message);
    if (!isClosed && !isUrl && itemsSent === 0) {
      const fallbackItems = await fallbackSearch(q, 20);
      for (const item of fallbackItems) {
        if (isClosed) break;
        res.write(`data: ${JSON.stringify(item)}\n\n`);
        itemsSent++;
      }
    }
    closeStream();
  }
};
