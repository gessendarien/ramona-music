import * as searchService from '../services/searchService.js';
import axios from 'axios';

export const search = async (req, res) => {
  try {
    const { q, source = 'youtube' } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const results = await searchService.searchYouTube(q, source);
    res.json(results);
  } catch (error) {
    console.error('Error in searchController.search:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
};

export const getInfo = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter "url" is required' });
    }
    const info = await searchService.getVideoInfo(url);
    res.json(info);
  } catch (error) {
    console.error('Error in searchController.getInfo:', error);
    res.status(500).json({ error: 'Failed to get video info' });
  }
};

export const searchCover = async (req, res) => {
  try {
    const { q, artist } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const promises = [
      axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=6`)
    ];
    
    if (artist) {
      promises.push(
        axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=album&attribute=artistTerm&limit=6`).catch(() => null)
      );
    }
    
    const responses = await Promise.all(promises);
    
    let allResults = [];
    if (responses[0] && responses[0].data && responses[0].data.results) {
       allResults = [...allResults, ...responses[0].data.results];
    }
    if (responses[1] && responses[1] && responses[1].data && responses[1].data.results) {
       allResults = [...allResults, ...responses[1].data.results];
    }
    
    // Remove duplicates based on artworkUrl100
    const uniqueResults = allResults.filter((v, i, a) => a.findIndex(t => (t.artworkUrl100 === v.artworkUrl100)) === i);
    
    res.json({ results: uniqueResults.slice(0, 12) });
  } catch (error) {
    console.error('Error in searchController.searchCover:', error.message);
    res.status(500).json({ error: 'Failed to search cover on iTunes' });
  }
};
