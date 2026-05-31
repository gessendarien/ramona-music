# 🎵 Ramona Music - Multiplataforma

Aplicación de descarga de música de YouTube para **Casa OS** (Web Docker) y **Android** (APK), con almacenamiento en Navidrome y recomendaciones musicales inteligentes.

## 🎯 Características

- 🎵 Descarga música de YouTube y YouTube Music
- 💾 Almacenamiento automático en Navidrome
- 🎨 Interfaz moderna y responsiva con modo oscuro
- 🎯 Recomendaciones musicales via Last.fm API (gratuita)
- 📊 Seguimiento de descargas en tiempo real
- 🔍 Búsqueda de canciones y artistas
- 📱 **APP Android compilable a APK**
- 🏠 **Web responsiva para Casa OS**
- 🔄 Backend compartido entre plataformas

## 📋 Requisitos

### Para Casa OS (Web Docker)
- Docker y Docker Compose
- Navidrome instalado
- Acceso a carpeta de música de Navidrome

### Para Android APK
- Node.js 16+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli` (para compilación en la nube)
- Cuenta Expo (gratuita) - https://expo.dev
- Android SDK (si compilas localmente)

## 🚀 Instalación

### Opción 1: Casa OS (Docker)

```bash
cd /DATA/AppData
git clone <repo-url> ramona-music
cd ramona-music

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API Key de Last.fm y ruta de Navidrome

# Iniciar
docker-compose up -d
```

Accede en: `http://tu-servidor:3000`

### Opción 2: Android APK

#### A. Desarrollo en tiempo real (emulador)

```bash
cd ramona-music/mobile

npm install
expo start

# En otra terminal
expo run:android
# O presiona 'a' en la consola de Expo
```

#### B. Compilar APK para distribuir

**Opción B1: Compilación en Expo Cloud (recomendado)**

```bash
cd ramona-music/mobile

# Login en Expo
eas login

# Compilar APK
eas build --platform android

# Descargará el APK automáticamente
```

**Opción B2: Compilar localmente**

```bash
cd ramona-music/mobile

npm install
npx expo prebuild --clean
cd android
./gradlew assembleRelease

# APK estará en: android/app/build/outputs/apk/release/app-release.apk
```

## 📁 Estructura del Proyecto

```
ramona-music/
├── backend/                    # API Node.js (compartida Web + Android)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── package.json
│   └── Dockerfile
│
├── shared/                     # Código compartido Web + Android
│   ├── apiService.js           # Cliente API
│   └── constants.js            # Constantes globales
│
├── web/                        # React Web (Casa OS - Docker)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── mobile/                     # React Native + Expo (Android)
│   ├── app/
│   │   ├── screens/
│   │   ├── components/
│   │   └── services/
│   ├── App.js
│   ├── app.json                # Configuración Expo
│   ├── eas.json                # Configuración compilación APK
│   └── package.json
│
├── docker-compose.yml          # Orquestación Casa OS
├── README.md                   # Este archivo
└── .env.example                # Variables de entorno
```

## 🔧 Configuración de APIs

### Last.fm (Gratuita - Para Recomendaciones)

1. Ve a: https://www.last.fm/api/account/create
2. Crea una aplicación
3. Copia tu API Key
4. Agrega a `.env`:
```
LASTFM_API_KEY=tu_api_key_aqui
```

### Para Android APK en Expo

1. Crea cuenta en https://expo.dev (gratis)
2. Configura credenciales:
```bash
cd mobile
eas login
eas init  # Si es la primera vez
```

## 📱 Diferencias entre Plataformas

| Feature | Casa OS | Android |
|---------|---------|---------|
| Descargas | ✅ | ✅ |
| Recomendaciones | ✅ | ✅ |
| Búsqueda | ✅ | ✅ |
| Modo oscuro | ✅ | ✅ |
| Almacenamiento local | ✅ | ✅ (SQLite) |
| Push Notifications | ❌ | ✅ |
| Widget | ❌ | ✅ |
| Compartir canciones | ❌ | ✅ |

## 🎨 Diseño Responsivo

Ambas plataformas usan el mismo sistema de diseño:
- Colores: Sistema Material Design 3
- Tipografía: Inter
- Iconos: Material Symbols
- Adaptable a cualquier tamaño de pantalla

## 🔐 Seguridad

- Backend: CORS configurado
- Credenciales: Variables de entorno
- Descarga segura: Validación de URLs
- API Keys: No se exponen en el cliente

## 🐛 Solución de Problemas

### Casa OS
```bash
# Ver logs
docker-compose logs -f backend

# Reiniciar
docker-compose restart
```

### Android
```bash
# Limpiar cache Expo
expo r -c

# Ejecutar en emulador limpio
expo run:android --clean

# Ver logs del dispositivo
adb logcat | grep ReactNativeJS
```

## 🚀 Despliegue en Producción

### Casa OS
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Android APK
El APK compilado está listo para distribuir y instalar directamente en dispositivos Android.

**Para distribuir en Google Play:**
1. Firmar el APK con tu clave de desarrollo
2. Crear una cuenta de desarrollador en Google Play
3. Subir el APK a la consola de Google Play

## 📝 Variables de Entorno

```bash
# Backend
NODE_ENV=production
PORT=3001
MUSIC_PATH=/music
LASTFM_API_KEY=xxx

# Móvil & Web
REACT_APP_API_URL=http://localhost:3001
REACT_APP_LASTFM_API_KEY=xxx
```

## 🤝 Desarrollo

```bash
# Instalar dependencias de todas las plataformas
npm install
cd backend && npm install && cd ..
cd mobile && npm install && cd ..
cd web && npm install && cd ..

# Iniciar backend
cd backend
npm run dev

# En otra terminal, iniciar app Android
cd mobile
expo start
# Presiona 'a' para emulador o instala en dispositivo

# En otra terminal, iniciar web
cd web
npm start
```

## 📄 Licencia

MIT

## 📞 Soporte

- Documentación: `/docs`
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

**Hecho con ❤️ para Casa OS y dispositivos Android**
# ramona-music
