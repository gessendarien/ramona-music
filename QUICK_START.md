# 🚀 QUICK START - Ramona Music

Empieza con Ramona Music en minutos.

---

## ⚡ Opción 1: Casa OS (Docker) - 5 minutos

```bash
# 1. Clonar repo
cd /DATA/AppData
git clone https://github.com/tu-usuario/ramona-music.git
cd ramona-music

# 2. Configurar
cp .env.example .env
# Edita .env y cambia MUSIC_PATH a tu ruta real

# 3. Ejecutar
docker-compose up -d

# 4. Abrir navegador
# http://localhost:3000
```

**¡Listo! 🎉**

---

## 📱 Opción 2: Android APK - 10 minutos

```bash
# 1. Clonar repo
git clone https://github.com/tu-usuario/ramona-music.git
cd ramona-music/mobile

# 2. Instalar
npm install

# 3. Crear cuenta Expo (gratuita)
# https://expo.dev/signup

# 4. Compilar APK
npm install -g eas-cli
eas login
eas build --platform android

# 5. Instalar en dispositivo
# Descargar APK y hacer tap para instalar

# 6. Configurar en app
# Settings > Server URL > http://tu-ip:3001
```

**¡APK listo! 📦**

---

## 🔧 Configuración de Last.fm (Necesario para Recomendaciones)

1. Ve a: https://www.last.fm/api/account/create
2. Crea una aplicación
3. Copia tu **API Key**
4. Edita `.env` y agrega:
   ```
   LASTFM_API_KEY=abc123...
   ```
5. Reinicia servicios

---

## 📚 Documentación

- **README.md** - Descripción general
- **docs/INSTALLATION.md** - Instalación Casa OS detallada
- **docs/ANDROID_BUILD.md** - Compilar APK paso a paso
- **docs/DEVELOPMENT.md** - Para desarrolladores
- **PROJECT_SUMMARY.md** - Arquitectura visual

---

## ✅ Verificar que Funciona

### Casa OS
```bash
# Backend ok?
curl http://localhost:3001/health

# Web ok?
# Abre http://localhost:3000
```

### Android
1. Abre la app
2. Busca una canción
3. Presiona descargar
4. Espera completación
5. Aparecerá en Navidrome

---

## 🆘 Problemas Comunes

### "Connection refused"
```bash
# Casa OS
docker-compose restart backend

# Mobile
expo r -c
```

### "API Key no funciona"
- Verifica que tengas una clave válida de Last.fm
- Recarga la app

### "Música no aparece en Navidrome"
- Rescanea la biblioteca en Navidrome
- Verifica carpeta: `/DATA/Media/Music/`

---

## 🎯 Próximos Pasos

1. ✅ Instala Ramona Music
2. ✅ Prueba descargando una canción
3. ✅ Agrega a tus favoritos
4. 📖 Lee documentación para personalizar
5. 🤝 Contribuye con mejoras

---

## 📞 Ayuda

- **Documentación:** Ver carpeta `/docs/`
- **Problemas:** GitHub Issues
- **Preguntas:** GitHub Discussions

---

**¡Enjoy! 🎵**
