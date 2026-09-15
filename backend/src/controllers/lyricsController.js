
import axios from 'axios';
import translate from 'google-translate-api-x';

export const getLyrics = async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Clean title for better searching (remove (Video Oficial), [Lyrics], etc)
    let cleanTitle = title.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '').trim();
    // Some titles are like "Artist - Title", so we just use the whole clean title + artist for fuzzy search
    const searchQuery = `${cleanTitle} ${artist || ''}`.trim();

    // Call LRCLIB API with fuzzy search
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'RamonaMusic/1.0 (https://github.com/RamonaMusic)'
      }
    });

    const results = response.data;
    if (results && results.length > 0) {
      // Find the best match, preferably one with syncedLyrics
      const bestMatch = results.find(r => r.syncedLyrics) || results[0];
      return res.json(bestMatch);
    } else {
      return res.status(404).json({ error: 'Lyrics not found' });
    }
  } catch (error) {
    console.error('Error fetching lyrics:', error.message);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
};

export const translateLyrics = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // First detect language (we can do it in one pass by translating to 'auto' but the API will just return the text. Let's just default to es, and if source is es, go to en)
    const result = await translate(text, { to: 'es' });

    if (result.from.language.iso === 'es') {
      // It was already Spanish, translate to English
      const engResult = await translate(text, { to: 'en' });
      return res.json({ translatedText: engResult.text, from: 'es', to: 'en' });
    }

    return res.json({ translatedText: result.text, from: result.from.language.iso, to: 'es' });

  } catch (error) {
    console.error('Error translating lyrics:', error.message);
    res.status(500).json({ error: 'Failed to translate lyrics' });
  }
};
