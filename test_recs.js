import { searchYouTube } from './backend/src/services/searchService.js';
(async () => {
  const seedArtist = 'Vetusta Morla';
  const ytRelated = await searchYouTube(`canciones parecidas a ${seedArtist} audio`);
  const filtered = ytRelated.filter(v => v.duration && v.duration.length <= 5 && !v.title.toLowerCase().includes('completo'));
  console.log(filtered.slice(0, 5).map(v => v.title));
})();
