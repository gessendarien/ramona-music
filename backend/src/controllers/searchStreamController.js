import { spawn } from 'child_process';

export const streamSearch = (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  const isUrl = /^https?:\/\/(www\.youtube\.com|youtu\.be)\//.test(q);
  const target = isUrl ? q : `ytsearch20:${q}`;

  const ytDlp = spawn('yt-dlp', [
    target,
    '--dump-json',
    '--flat-playlist',
    '--no-warnings'
  ]);

  let buffer = '';

  ytDlp.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    // keep the last incomplete line in the buffer
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
        } catch (err) {
          console.error("Failed to parse yt-dlp json line", err);
        }
      }
    }
  });

  ytDlp.stderr.on('data', (data) => {
    // Ignore stderr to not spam logs, or log it if needed
  });

  ytDlp.on('close', (code) => {
    res.write('event: end\ndata: {}\n\n');
    res.end();
  });
  
  req.on('close', () => {
    ytDlp.kill();
  });
};
