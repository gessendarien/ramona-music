# 👨‍💻 Guía de Desarrollo - Ramona Music

Información técnica para desarrolladores que quieran contribuir o personalizar Ramona Music.

## 🏗️ Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────┐
│           RAMONA MUSIC ARCHITECTURE             │
└─────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   WEB (React)        │         │  MOBILE (React       │
│   Casa OS - Docker   │         │  Native - Android)   │
│   Port: 3000         │         │                      │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                 │
           │          HTTP/REST API          │
           └────────────┬────────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   BACKEND API (Node.js)     │
         │   Express + Controllers     │
         │   Port: 3001                │
         │   Docker: ramona_network    │
         └──────────────┬──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  ┌─────▼─────┐   ┌─────▼─────┐  ┌─────▼─────┐
  │ Download  │   │  Search   │  │ Recommend │
  │ Service   │   │  Service  │  │ Service   │
  │ (yt-dlp)  │   │ (YouTube) │  │ (Last.fm) │
  └─────┬─────┘   └───────────┘  └───────────┘
        │
  ┌─────▼──────────────────┐
  │  FILE SYSTEM / STORAGE │
  │  /DATA/Media/Music/    │
  │  (Navidrome folder)    │
  └────────────────────────┘
```

## 📦 Stack Tecnológico

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4
- **Descarga:** yt-dlp (Python)
- **Audio:** FFmpeg
- **Metadatos:** node-id3, music-metadata
- **Recomendaciones:** Last.fm API
- **Base de datos:** Archivos (sin DB)

### Frontend Web (Casa OS)
- **Framework:** React 18
- **Compilación:** Create React App
- **Estilos:** Tailwind CSS
- **Iconos:** Material Symbols
- **Servidor:** Nginx
- **Contenedor:** Docker

### Mobile (Android)
- **Framework:** React Native
- **Expo:** Para compilación y build
- **Navegación:** React Navigation
- **Iconos:** Ionicons
- **Almacenamiento:** AsyncStorage

### DevOps
- **Contenedores:** Docker
- **Orquestación:** Docker Compose
- **Build Mobile:** EAS (Expo Application Services)

## 🚀 Iniciar Desarrollo Local

### 1. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con rutas locales
nano .env

# Iniciar en modo desarrollo (con auto-reload)
npm run dev
```

Backend estará en `http://localhost:3001`

### 2. Configurar Web (Casa OS)

```bash
cd web

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# O build para producción
npm run build
```

Web estará en `http://localhost:3000`

### 3. Configurar Mobile (Android)

```bash
cd mobile

# Instalar dependencias
npm install

# Iniciar servidor Expo
expo start

# En otra terminal:
# Para emulador
expo run:android

# O para dispositivo físico
# Escanea el código QR con tu teléfono
```

## 📝 Estructura de Carpetas Detallada

### Backend

```
backend/
├── src/
│   ├── app.js                 # Servidor Express principal
│   ├── controllers/           # Manejadores de rutas
│   │   ├── downloadController.js
│   │   ├── searchController.js
│   │   └── recommendationsController.js
│   ├── services/              # Lógica de negocio
│   │   ├── downloadService.js
│   │   ├── searchService.js
│   │   └── recommendationsService.js
│   └── utils/                 # Funciones auxiliares
│       ├── logger.js
│       └── validators.js
├── downloads/                 # Almacenamiento temporal
├── logs/                      # Logs de la aplicación
├── package.json
├── Dockerfile
└── .env.example
```

### Frontend Web

```
web/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── components/            # Componentes React reutilizables
│   │   ├── Header.jsx
│   │   ├── Player.jsx
│   │   ├── TrackList.jsx
│   │   └── SearchBar.jsx
│   ├── pages/                 # Páginas/vistas principales
│   │   ├── RecommendedPage.jsx
│   │   ├── DownloadsPage.jsx
│   │   └── SearchPage.jsx
│   ├── services/              # Servicios API
│   │   ├── apiService.js      # Cliente HTTP
│   │   └── playerService.js
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useDownload.js
│   │   └── useSearch.js
│   ├── styles/                # Estilos globales
│   │   └── index.css
│   ├── App.jsx                # Componente raíz
│   └── index.js               # Entry point
├── package.json
├── Dockerfile
├── nginx.conf
└── .env.example
```

### Mobile (Android)

```
mobile/
├── app/
│   ├── screens/               # Pantallas principales
│   │   ├── RecommendedScreen.js
│   │   ├── SearchScreen.js
│   │   ├── DownloadsScreen.js
│   │   ├── SettingsScreen.js
│   │   └── SplashLoadingScreen.js
│   ├── components/            # Componentes reutilizables
│   │   ├── TrackCard.js
│   │   ├── DownloadItem.js
│   │   └── GenreSelector.js
│   ├── services/              # Servicios
│   │   ├── apiService.js
│   │   ├── storageService.js
│   │   └── notificationService.js
│   ├── utils/                 # Utilidades
│   │   ├── constants.js
│   │   └── formatters.js
│   └── App.js                 # Componente raíz
├── assets/                    # Imágenes, fuentes, etc
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── app.json                   # Configuración Expo
├── eas.json                   # Configuración compilación
├── package.json
├── babel.config.js
└── .env.example
```

### Shared

```
shared/
├── apiService.js              # Cliente API compartido
├── constants.js               # Constantes globales
└── utils.js                   # Funciones de utilidad
```

## 🔌 API Endpoints

### Descargas

```
POST   /api/download                    # Iniciar descarga
GET    /api/download                    # Listar descargas
GET    /api/download/:id                # Obtener estado
DELETE /api/download/:id                # Eliminar descarga
```

### Búsqueda

```
GET    /api/search?q=query&limit=10    # Buscar en YouTube
GET    /api/search/info?url=...        # Información de video
```

### Recomendaciones

```
GET    /api/recommendations/trending    # Canciones populares
GET    /api/recommendations/similar?artist=...  # Artistas similares
GET    /api/recommendations/genre/:genre # Por género
GET    /api/recommendations/top-genres  # Géneros populares
```

### Health

```
GET    /health                          # Estado del servidor
```

## 🛠️ Herramientas de Desarrollo

### Backend

```bash
# Iniciar con auto-reload
npm run dev

# Linting
npm run lint

# Tests
npm run test

# Ver logs
docker-compose logs -f backend
```

### Web

```bash
# Iniciar desarrollo
npm start

# Build
npm run build

# Linting
npm run lint

# Testing
npm test
```

### Mobile

```bash
# Iniciar
expo start

# En emulador
expo run:android

# Limpiar cache
expo r -c

# Build APK
eas build --platform android
```

## 📚 Guías de Código

### Crear un nuevo endpoint en Backend

1. Crear controller en `src/controllers/`:

```javascript
const express = require('express');
const router = express.Router();

router.get('/ruta', async (req, res) => {
  try {
    // Tu lógica aquí
    res.json({ data: 'resultado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

2. Registrarlo en `src/app.js`:

```javascript
const myRoutes = require('./controllers/myController');
app.use('/api/myroute', myRoutes);
```

### Crear un nuevo componente en Web

```javascript
// components/MyComponent.jsx
import React from 'react';

const MyComponent = ({ data, onAction }) => {
  return (
    <div className="bg-surface-container rounded-lg p-4">
      <h3 className="text-on-surface font-bold">{data.title}</h3>
      <button 
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-primary rounded hover:opacity-90"
      >
        Acción
      </button>
    </div>
  );
};

export default MyComponent;
```

### Crear una nueva pantalla en Mobile

```javascript
// app/screens/MyScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import apiService from '../../shared/apiService';

const MyScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await apiService.getData();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Pantalla</Text>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0e0e' },
  title: { color: '#e7e5e4', fontSize: 18, fontWeight: 'bold' },
});

export default MyScreen;
```

## 🔗 Variables de Entorno

### Backend (.env)

```bash
NODE_ENV=development
PORT=3001
MUSIC_PATH=/path/to/music
LASTFM_API_KEY=your_key
LOG_LEVEL=debug
```

### Frontend Web (.env)

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_LASTFM_API_KEY=your_key
```

### Mobile (.env)

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

## 🧪 Testing

### Backend

```bash
cd backend
npm test

# Ver cobertura
npm test -- --coverage
```

### Web

```bash
cd web
npm test

# Ver cobertura
npm test -- --coverage
```

### Mobile

```bash
cd mobile
npm test
```

## 🐛 Debugging

### Backend

```bash
# Activar logs detallados
LOG_LEVEL=debug npm run dev

# Debugger de Node.js
node --inspect src/app.js
```

### Web

En navegador: Abre DevTools (F12)

### Mobile

```bash
# Logs en tiempo real
expo r -c

# Debugger remoto
expo start
# Presiona 'd' para abrir debugger
```

## 📦 Build para Producción

### Backend (Docker)

```bash
docker build -t ramona-music-backend ./backend
docker run -e MUSIC_PATH=/music ramona-music-backend
```

### Web (Docker)

```bash
docker build -t ramona-music-web ./web
docker run -p 3000:80 ramona-music-web
```

### Mobile (APK Android)

```bash
cd mobile
eas build --platform android
```

## 🤝 Contribuciones

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commit cambios: `git commit -am 'Agregar nueva feature'`
4. Push a rama: `git push origin feature/nueva-feature`
5. Abre Pull Request

## 📞 Soporte

- Documentación: `/docs`
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

**Happy coding! 🚀**
