# 🎵 RAMONA MUSIC - RESUMEN DEL PROYECTO

## 🎯 Visión General

Ramona Music es una aplicación **multiplataforma** para descargar música de YouTube y almacenarla automáticamente en **Navidrome**.

**Objetivo:** Un solo backend, dos formas de acceder:
- 🏠 **Web en Casa OS** (Docker) 
- 📱 **App Android** (APK compilable)

---

## 📊 Comparativa de Plataformas

|  | Casa OS (Web) | Android (APK) |
|---|---|---|
| **Interfaz** | React Web | React Native |
| **Despliegue** | Docker | APK directo en dispositivo |
| **Backend** | Compartido | Compartido |
| **Almacenamiento** | Carpeta Navidrome | Caché local + Navidrome |
| **Instalación** | `docker-compose up -d` | Descargar e instalar APK |
| **Push Notifications** | ❌ | ✅ |
| **Configuración** | En web | En app |

---

## 🏗️ Arquitectura Simplificada

```
USUARIOS
├── Casa OS
│   └── Navegador → http://localhost:3000
│       └── React Web (Responsive)
│
└── Android
    └── App APK
        └── React Native
            └── Material Design 3

     ↓↓↓ AMBOS USAN ↓↓↓

API BACKEND (Node.js)
├── /api/download       → Descargar de YouTube
├── /api/search         → Buscar canciones
└── /api/recommendations → Recomendaciones (Last.fm)

ALMACENAMIENTO
└── /DATA/Media/Music/ (Navidrome)
```

---

## 📁 Árbol de Carpetas Completo

```
ramona-music/
│
├── 📄 README.md ........................... Documentación principal
├── 📄 .env.example ....................... Variables de entorno
├── 📄 docker-compose.yml ................. Orquestación Casa OS
│
├── backend/ ............................. API Node.js
│   ├── src/
│   │   ├── app.js ....................... Express app
│   │   ├── controllers/
│   │   │   ├── downloadController.js
│   │   │   ├── searchController.js
│   │   │   └── recommendationsController.js
│   │   └── services/
│   │       ├── downloadService.js ....... Descarga con yt-dlp
│   │       ├── searchService.js ......... Búsqueda YouTube
│   │       └── recommendationsService.js . Last.fm API
│   ├── package.json
│   ├── Dockerfile ....................... Para Docker
│   └── downloads/ ....................... Almacenamiento temporal
│
├── web/ ................................. React para Casa OS
│   ├── public/
│   │   └── index.html ................... HTML con Tailwind
│   ├── src/
│   │   ├── App.jsx ...................... Componente raíz
│   │   ├── index.js ..................... Entry point
│   │   ├── components/
│   │   │   ├── Header.jsx .............. Navegación superior
│   │   │   ├── Player.jsx .............. Reproductor
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── RecommendedPage.jsx ..... Página de recomendados
│   │   │   ├── DownloadsPage.jsx ....... Página de descargas
│   │   │   └── ...
│   │   └── services/
│   │       └── apiService.js ........... Cliente API
│   ├── package.json
│   ├── Dockerfile ....................... Para Docker
│   ├── nginx.conf ....................... Configuración web
│   └── .env.example
│
├── mobile/ .............................. React Native + Expo
│   ├── App.js ........................... Componente raíz
│   ├── app/ 
│   │   ├── screens/
│   │   │   ├── RecommendedScreen.js
│   │   │   ├── SearchScreen.js
│   │   │   ├── DownloadsScreen.js
│   │   │   ├── SettingsScreen.js
│   │   │   └── SplashLoadingScreen.js
│   │   ├── components/
│   │   │   ├── TrackCard.js
│   │   │   ├── DownloadItem.js
│   │   │   └── ...
│   │   └── services/
│   │       ├── apiService.js ........... Cliente API
│   │       ├── storageService.js ....... AsyncStorage
│   │       └── notificationService.js .. Notificaciones
│   ├── assets/
│   │   ├── icon.png .................... Ícono app
│   │   ├── splash.png .................. Splash screen
│   │   └── adaptive-icon.png ........... Ícono adaptativo Android
│   ├── app.json ......................... Configuración Expo
│   ├── eas.json ......................... Compilación EAS
│   ├── package.json
│   ├── babel.config.js
│   └── .env.example
│
├── shared/ .............................. Código compartido
│   ├── apiService.js .................... Cliente HTTP (Web + Mobile)
│   └── constants.js ..................... Colores, mensajes, etc.
│
└── docs/ ............................... Documentación
    ├── README.md ....................... Instalación general
    ├── INSTALLATION.md ................. Guía Casa OS
    ├── ANDROID_BUILD.md ................ Compilar APK
    └── DEVELOPMENT.md .................. Para desarrolladores
```

---

## 🚀 Flujo de Uso

### Casa OS (Web)

```
1. Usuario abre navegador
   ↓
2. http://localhost:3000
   ↓
3. React Web carga
   ↓
4. Usuario busca canción
   ↓
5. Backend busca en YouTube
   ↓
6. Usuario presiona descargar
   ↓
7. Backend descarga con yt-dlp
   ↓
8. Se guarda en /DATA/Media/Music/
   ↓
9. Navidrome detecta y añade a biblioteca
```

### Android (APK)

```
1. Usuario abre Ramona Music App
   ↓
2. React Native UI carga
   ↓
3. Usuario configura IP del servidor
   ↓
4. Busca canción
   ↓
5. App llama a Backend remoto
   ↓
6. Usuario presiona descargar
   ↓
7. Backend descarga (igual que en web)
   ↓
8. Se notifica al usuario cuando termina
   ↓
9. Usuario puede compartir canción
```

---

## 🔧 Tecnologías Principales

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Framework web
- **yt-dlp** - Descarga de YouTube
- **Last.fm API** - Recomendaciones
- **FFmpeg** - Conversión audio

### Frontend Web
- **React 18** - UI Framework
- **Tailwind CSS** - Estilos
- **Material Symbols** - Iconos
- **Nginx** - Web server
- **Docker** - Contenedor

### Mobile
- **React Native** - Framework multiplataforma
- **Expo** - Herramientas desarrollo
- **React Navigation** - Navegación
- **Ionicons** - Iconos
- **EAS** - Build sistema

---

## 🎨 Diseño Compartido

Ambas plataformas usan:
- **Color Scheme:** Material Design 3 (Tema oscuro)
- **Tipografía:** Inter
- **Componentes:** Custom + Material Design
- **Responsive:** Adaptable a cualquier pantalla

**Paleta de Colores:**
```
Background:     #0e0e0e (Negro profundo)
Surface:        #1f2020 (Gris oscuro)
Primary:        #ffb3ae (Rosa/Coral)
Secondary:      #a79b9a (Gris)
Tertiary:       #ffdce7 (Rosa suave)
Text:           #e7e5e4 (Blanco roto)
Text Variant:   #acabaa (Gris claro)
```

---

## 📋 Checklist de Instalación

### Casa OS
- [ ] Docker instalado
- [ ] Navidrome configurado
- [ ] Clonar repositorio
- [ ] Configurar .env
- [ ] `docker-compose up -d`
- [ ] Acceder a http://localhost:3000

### Android
- [ ] Crear cuenta Expo
- [ ] Configurar EAS
- [ ] Clonar repositorio
- [ ] `npm install`
- [ ] `eas build --platform android`
- [ ] Instalar APK en dispositivo

---

## 🔐 Seguridad

### Backend
- CORS restringido
- Validación de URLs
- Rate limiting
- Variables de entorno para secrets

### APIs Externas
- Last.fm API Key en .env
- Solo lectura de datos públicos
- Sin almacenamiento de credenciales

### Almacenamiento
- Descargas en carpeta controlada
- Permisos correctos en archivos
- Limpieza de temporales

---

## 📈 Estadísticas del Proyecto

```
Líneas de código aproximadas:
├── Backend:     ~2000 LOC (Node.js + Express)
├── Web:         ~1500 LOC (React)
├── Mobile:      ~1200 LOC (React Native)
├── Shared:      ~300 LOC (Utils compartidos)
└── Total:       ~5000 LOC

Dependencias:
├── Backend:     13 dependencias principales
├── Web:         8 dependencias principales
├── Mobile:      14 dependencias principales
└── Total:       ~35 dependencias
```

---

## 🎯 Próximas Mejoras

- [ ] Soporte para Spotify
- [ ] Playlist automáticas
- [ ] Sincronización entre dispositivos
- [ ] Widget de Android
- [ ] Notificaciones push
- [ ] Búsqueda avanzada con filtros
- [ ] Descarga automática de novedades
- [ ] Tema claro

---

## 📞 Contacto y Soporte

- **Documentación:** Ver `/docs/`
- **Reporte de bugs:** GitHub Issues
- **Preguntas:** GitHub Discussions
- **Contribuciones:** Pull Requests

---

## 📄 Licencia

MIT - Libre para usar, modificar y distribuir

---

## 🎉 ¡Listo para empezar!

### Para Casa OS:
```bash
cd /DATA/AppData/ramona-music
docker-compose up -d
# Abre http://localhost:3000
```

### Para Android:
```bash
cd mobile
npm install
eas build --platform android
# Instala el APK en tu dispositivo
```

---

**Ramona Music** - Descargador de YouTube para Navidrome
*Hecho con ❤️ para Casa OS y Android*
