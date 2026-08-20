import * as recommendationsService from '../services/recommendationsService.js';

export const getRecommendations = async (req, res) => {
  try {
    const recommendations = await recommendationsService.fetchRecommendations(req);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};
