import axios from 'axios';
async function test() {
  const artist = encodeURIComponent("Siloé");
  let res = await axios.get(`https://itunes.apple.com/search?term=${artist}&entity=album&attribute=artistTerm&limit=5`);
  console.log("Artist Albums:", res.data.results.map(r => r.artistName + " - " + r.collectionName));
}
test();
