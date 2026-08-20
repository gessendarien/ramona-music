# 📱 Guía de Compilación APK - Ramona Music para Android

Esta guía te ayudará a compilar Ramona Music como un APK listo para instalar en dispositivos Android.

## 🚀 Opción 1: Compilación en la Nube (EAS) - Recomendado

La forma más rápida y sencilla. No requiere Android SDK.

### Paso 1: Preparar el proyecto

```bash
cd ramona-music/mobile

# Instalar dependencias
npm install

# Limpiar cache (si tuviste problemas antes)
npm install -g eas-cli expo-cli
```

### Paso 2: Crear cuenta Expo

1. Ve a https://expo.dev
2. Crea una cuenta (es gratuita)
3. Verifica tu email

### Paso 3: Autenticarse en EAS

```bash
# Login en tu cuenta Expo
eas login

# Introducir email y contraseña
```

### Paso 4: Inicializar el proyecto (primera vez)

```bash
eas init
# Selecciona la cuenta Expo que acabas de crear
# Acepta el ID del proyecto sugerido
```

### Paso 5: Compilar APK

```bash
# Compilación para pruebas (APK instalable)
eas build --platform android --local

# O compilación en la nube (más rápido, no requiere Node.js local)
eas build --platform android
```

**Tiempo de compilación:** 10-20 minutos

El APK se descargará automáticamente a tu carpeta de descargas.

## 🔧 Opción 2: Compilación Local - Para Desarrolladores

Requiere Android SDK pero más control.

### Paso 1: Instalar Android SDK

**En macOS (con Homebrew):**
```bash
brew install --cask android-studio
```

**En Windows:**
Descarga desde: https://developer.android.com/studio

**En Linux:**
```bash
sudo apt-get install android-studio
```

### Paso 2: Preparar el proyecto

```bash
cd ramona-music/mobile

npm install

# Prebuild generar carpeta android/
npx expo prebuild --clean
```

### Paso 3: Compilar APK

```bash
cd android

# Build debug (para pruebas)
./gradlew assembleDebug

# O build release (para distribuir)
./gradlew assembleRelease
```

**Ubicación del APK:**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 📋 Configuraciones Antes de Compilar

### 1. Configurar URL del Backend

Edita `ramona-music/mobile/app/config/api.js`:

```javascript
const API_BASE_URL = 'http://tu-ip-o-dominio:3001';
// Reemplaza con tu IP de Casa OS o servidor
```

### 2. Nombre y versión

Edita `app.json`:

```json
{
  "expo": {
    "name": "Ramona Music",
    "version": "1.0.0",
    "android": {
      "package": "com.ramonamusic.app",
      "versionCode": 1
    }
  }
}
```

## ✅ Instalación en Dispositivo

### Desde archivo APK

```bash
# Conectar dispositivo Android via USB
adb devices  # Verificar que aparezca el dispositivo

# Instalar APK
adb install -r app-release.apk
```

### Desde Expo (desarrollo)

```bash
cd mobile
expo start

# En otra terminal, presiona 'a' o ejecuta:
expo run:android
```

## 🔐 Firmar APK para Google Play

Si quieres distribuir en Google Play necesitas firmar el APK.

### Generar clave de firma

```bash
keytool -genkey -v -keystore release.keystore \
  -alias ramonamusic \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Responde las preguntas sobre tu información.

### Configurar firma en gradle

Edita `android/app/build.gradle`:

```gradle
android {
  signingConfigs {
    release {
      keyAlias 'ramonamusic'
      keyPassword 'tu_password'
      storeFile file('release.keystore')
      storePassword 'tu_password'
    }
  }
  
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
}
```

### Compilar APK firmado

```bash
./gradlew assembleRelease
# APK firmado en: app/build/outputs/apk/release/
```

## 📤 Subir a Google Play

1. Crea una cuenta en Google Play Console
2. Crea una nueva aplicación
3. Completa los detalles de la app
4. Sube el APK
5. Llena la información requerida
6. Envía a revisión

## 🐛 Solución de Problemas

### "gradle command not found"

```bash
# Asegúrate de estar en el directorio correcto
cd ramona-music/mobile

# O instala gradle globalmente
npm install -g gradle
```

### "SDK not found"

Asegúrate que `ANDROID_HOME` esté configurado:

```bash
# En macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
```

### "Expo CLI not found"

```bash
npm install -g expo-cli eas-cli
```

### Error de compilación en EAS

```bash
# Limpiar y reintentar
cd mobile
rm -rf .expo
rm -rf node_modules
npm install
eas build --platform android --clean
```

## 📊 Tamaño del APK

- **Sin optimizar:** ~80-100 MB
- **Con ProGuard:** ~50-70 MB
- **Con App Bundle:** ~40-50 MB

## ✨ Optimizaciones Recomendadas

Para reducir tamaño y mejorar performance:

```bash
# En mobile/app.json:
{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "android": {
          "usesCleartextTraffic": true,
          "extraMiniBuildGradle": [
            {
              "install": "implementation 'com.google.android.material:material:1.9.0'"
            }
          ]
        }
      }]
    ]
  }
}
```

## 🎯 Siguiente Paso

Una vez tengas el APK listo:

1. **Pruebas:** Instala en varios dispositivos Android
2. **Retroalimentación:** Pide feedback a usuarios
3. **Distribución:** 
   - Compartir APK directamente
   - Subir a Google Play
   - Crear repositorio F-Droid

---

¿Problemas? Consulta:
- https://docs.expo.dev
- https://eas.readthedocs.io
- https://react-native.dev
