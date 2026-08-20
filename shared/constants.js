/**
 * Constantes compartidas
 * Usado por: Web, Mobile, Backend
 */

// ============ COLORES - Material Design 3 ============
export const COLORS = {
  // Light Mode
  light: {
    background: '#fffbfe',
    surface: '#fffbfe',
    primary: '#c4001d',
    secondary: '#625b71',
    tertiary: '#7d5260',
    error: '#b3261e',
  },
  // Dark Mode (por defecto)
  dark: {
    background: '#0e0e0e',
    surface: '#0e0e0e',
    surfaceContainer: '#191a1a',
    surfaceContainerLow: '#131313',
    surfaceContainerHigh: '#1f2020',
    primary: '#ffb3ae',
    secondary: '#a79b9a',
    tertiary: '#ffdce7',
    error: '#ec7c8a',
    onSurface: '#e7e5e4',
    onSurfaceVariant: '#acabaa',
  },
};

// ============ ESTADOS DE DESCARGA ============
export const DOWNLOAD_STATUS = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  DOWNLOADING: 'downloading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  PAUSED: 'paused',
};

// ============ GÉNEROS DE MÚSICA ============
export const MUSIC_GENRES = [
  'electronic',
  'rock',
  'indie',
  'alternative',
  'pop',
  'hip-hop',
  'metal',
  'jazz',
  'classical',
  'ambient',
  'rnb',
  'folk',
  'country',
  'reggae',
  'latin',
];

// ============ CALIDADES DE AUDIO ============
export const AUDIO_QUALITY = {
  LOW: '128k',
  MEDIUM: '192k',
  HIGH: '256k',
  LOSSLESS: 'wav',
  FLAC: 'flac',
};

// ============ ERRORES ============
export const ERROR_MESSAGES = {
  INVALID_URL: 'La URL no es válida. Por favor, proporciona un enlace de YouTube válido.',
  DOWNLOAD_FAILED: 'Error al descargar. Intenta de nuevo.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  NO_RESULTS: 'No se encontraron resultados. Intenta otra búsqueda.',
  BACKEND_UNAVAILABLE: 'El servidor no está disponible en este momento.',
  INVALID_API_KEY: 'Configuración de API incompleta.',
  FILE_SAVE_ERROR: 'Error al guardar el archivo.',
  METADATA_ERROR: 'Error al procesar metadatos.',
};

// ============ MENSAJES DE ÉXITO ============
export const SUCCESS_MESSAGES = {
  DOWNLOAD_STARTED: 'Descarga iniciada. Aparecerá en tu biblioteca pronto.',
  DOWNLOAD_COMPLETED: 'Descarga completada. ¡Disfruta la música!',
  TRACK_ADDED: 'Canción agregada a descargas.',
  TRACK_REMOVED: 'Canción removida.',
  SETTINGS_SAVED: 'Configuración guardada.',
};

// ============ DURACIÓN DE TOASTS/NOTIFICACIONES ============
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3500,
  LONG: 5000,
};

// ============ LÍMITES ============
export const LIMITS = {
  MAX_SEARCH_RESULTS: 50,
  MAX_TRENDING_TRACKS: 100,
  MAX_RECOMMENDATIONS: 50,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SEARCH_DEBOUNCE_MS: 300,
  DOWNLOAD_CHECK_INTERVAL_MS: 1000,
};

// ============ PATHS ============
export const PATHS = {
  RECOMMENDED: 'recommended',
  DOWNLOADS: 'downloads',
  SEARCH: 'search',
  SETTINGS: 'settings',
};

// ============ REDES SOCIALES ============
export const SOCIAL = {
  github: 'https://github.com',
  twitter: 'https://twitter.com',
  discord: 'https://discord.com',
};

// ============ URLS EXTERNAS ============
export const EXTERNAL_URLS = {
  RECCOBEATS_API: 'https://api.reccobeats.com',
  EXPO_BUILD: 'https://expo.dev',
  GITHUB: 'https://github.com',
  NAVIDROME_DOCS: 'https://www.navidrome.org',
  CASA_OS: 'https://www.casaos.io',
};

// ============ REGEX ============
export const REGEX = {
  YOUTUBE_URL: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  FILE_NAME: /^[a-z0-9_-]{3,50}$/i,
};

export default {
  COLORS,
  DOWNLOAD_STATUS,
  MUSIC_GENRES,
  AUDIO_QUALITY,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TOAST_DURATION,
  LIMITS,
  PATHS,
  SOCIAL,
  EXTERNAL_URLS,
  REGEX,
};
