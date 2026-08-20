import axios from 'axios';

export const API_URL = `http://${window.location.hostname}:3001/api`;

const api = axios.create({
  baseURL: API_URL,
});

export const searchTracks = async (query, source = 'youtube') => {
  const response = await api.get(`/search?q=${encodeURIComponent(query)}&source=${source}`);
  return response.data;
};

export const searchCover = async (query, artist = '') => {
  let url = `/search/cover?q=${encodeURIComponent(query)}`;
  if (artist) url += `&artist=${encodeURIComponent(artist)}`;
  const response = await api.get(url);
  return response.data;
};

export const getRecommendations = async () => {
  const response = await api.get('/recommendations');
  return response.data;
};

export const getLyrics = async (title, artist) => {
  const response = await api.get(`/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
  return response.data;
};

export const translateLyrics = async (text) => {
  const response = await api.post('/lyrics/translate', { text });
  return response.data;
};

export const backupTrack = async (track) => {
  const response = await api.post('/backup', {
    trackId: track.id,
    title: track.title,
    artist: track.artist || track.channel || 'Unknown Artist'
  });
  return response.data;
};

export const getLibraryTracks = async () => {
  const response = await api.get('/backup/library');
  return response.data;
};

export const getBackupStatus = async () => {
  const response = await api.get('/backup/status');
  return response.data;
};

export const deleteTracks = async (filePaths) => {
  const response = await axios.delete(`${API_URL}/backup`, {
    data: { filePaths }
  });
  return response.data;
};

export const updateMetadata = async (data) => {
  const response = await api.post('/backup/metadata', data);
  return response.data;
};

export const getConfig = async () => {
  const response = await api.get('/config');
  return response.data;
};

export const saveConfig = async (config) => {
  const response = await api.post('/config', config);
  return response.data;
};

export default api;
