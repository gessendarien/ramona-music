import { searchYouTube } from './src/services/searchService.js';
async function run() {
  console.log("Fetching playlist...");
  const res = await searchYouTube("https://www.youtube.com/playlist?list=PL4fGSI1pT0PneC5oYdJmHkP1b09uP_d2L".replace("PL4fGSI1pT0PneC5oYdJmHkP1b09uP_d2L", "PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"));
  console.log(`Fetched ${res.length} tracks.`);
  console.log(res.slice(0, 3));
}
run();
