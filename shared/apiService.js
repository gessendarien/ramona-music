/**
 * API Service Compartido
 * Usado por: Web, Mobile (React Native), Backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza una petición HTTP genérica
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // ============ DESCARGAS ============

  /**
   * Inicia la descarga de una canción
   */
  async downloadTrack(url, title = '', artist = '') {
    return this.request('/api/download', {
      method: 'POST',
      body: JSON.stringify({ url, title, artist }),
    });
  }

  /**
   * Obtiene el estado de una descarga específica
   */
  async getDownloadStatus(downloadId) {
    return this.request(`/api/download/${downloadId}`);
  }

  /**
   * Obtiene todas las descargas activas
   */
  async getDownloads() {
    return this.request('/api/download');
  }

  /**
   * Elimina una descarga del registro
   */
  async deleteDownload(downloadId) {
    return this.request(`/api/download/${downloadId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Monitorea el progreso de una descarga
   */
  async watchDownloadProgress(downloadId, onProgress, interval = 1000) {
    return new Promise((resolve, reject) => {
      const timer = setInterval(async () => {
        try {
          const status = await this.getDownloadStatus(downloadId);
          onProgress(status);

          if (status.status === 'completed' || status.status === 'error') {
            clearInterval(timer);
            resolve(status);
          }
        } catch (error) {
          clearInterval(timer);
          reject(error);
        }
      }, interval);
    });
  }

  // ============ BÚSQUEDA ============

  /**
   * Busca canciones en YouTube
   */
  async searchYouTube(query, limit = 10) {
    return this.request(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  /**
   * Obtiene información de un video de YouTube
   */
  async getVideoInfo(url) {
    return this.request(`/api/search/info?url=${encodeURIComponent(url)}`);
  }

  // ============ RECOMENDACIONES ============

  /**
   * Obtiene canciones trending
   */
  async getTrendingTracks(limit = 20, genre = null) {
    let url = `/api/recommendations/trending?limit=${limit}`;
    if (genre) {
      url += `&genre=${encodeURIComponent(genre)}`;
    }
    return this.request(url);
  }

  /**
   * Obtiene artistas similares
   */
  async getSimilarArtists(artist, limit = 10) {
    return this.request(
      `/api/recommendations/similar?artist=${encodeURIComponent(artist)}&limit=${limit}`
    );
  }

  /**
   * Obtiene recomendaciones por género
   */
  async getGenreRecommendations(genre, limit = 20) {
    return this.request(
      `/api/recommendations/genre/${encodeURIComponent(genre)}?limit=${limit}`
    );
  }

  /**
   * Obtiene los géneros más populares
   */
  async getTopGenres() {
    return this.request('/api/recommendations/top-genres');
  }

  /**
   * Obtiene información de un artista
   */
  async getArtistInfo(artist) {
    return this.request(
      `/api/recommendations/artist/${encodeURIComponent(artist)}`
    );
  }

  // ============ HEALTH ============

  /**
   * Verifica si el backend está disponible
   */
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Espera a que el backend esté disponible
   */
  async waitForBackend(maxAttempts = 10, delayMs = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.healthCheck();
        if (response.status === 'ok') {
          console.log('Backend disponible');
          return true;
        }
      } catch (error) {
        console.log(`Intento ${i + 1}/${maxAttempts} fallido, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Backend no disponible después de varios intentos');
  }
}

// Exportar instancia singleton
const apiService = new ApiService();

export default apiService;
