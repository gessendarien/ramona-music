# 🏠 Instalación en Casa OS

Guía paso a paso para instalar Ramona Music en tu servidor Casa OS.

## 📋 Requisitos Previos

- Casa OS instalado y funcionando
- Docker y Docker Compose (viene con Casa OS)
- Navidrome instalado (https://www.navidrome.org)
- Acceso SSH a tu servidor Casa OS (opcional pero recomendado)
- Una carpeta de música accesible por Navidrome

## 📁 Estructura Esperada

Tu estructura de carpetas debe ser aproximadamente así:

```
/DATA/
├── AppData/          # Donde va Ramona Music
├── Media/
│   └── Music/        # Carpeta de música de Navidrome (IMPORTANTE)
└── ...
```

## 🚀 Instalación Paso a Paso

### Paso 1: Clonar o Descargar el Repositorio

#### Opción A: Usando Git (recomendado)

```bash
cd /DATA/AppData
git clone https://github.com/tu-usuario/ramona-music.git
cd ramona-music
```

#### Opción B: Descargar ZIP

1. Descarga desde: https://github.com/tu-usuario/ramona-music/releases
2. Extrae en `/DATA/AppData/`
3. Renombra la carpeta a `ramona-music`

### Paso 2: Configurar Variables de Entorno

```bash
cd /DATA/AppData/ramona-music

# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo
nano .env
# O usa el editor de Casa OS si está disponible
```

**Variables a configurar:**

```bash
# Ruta a la carpeta de música de Navidrome
MUSIC_PATH=/DATA/Media/Music

# API Key de Last.fm (obtén una gratis en https://www.last.fm/api)
LASTFM_API_KEY=tu_api_key_aqui

# Nivel de log (info, debug, warn, error)
LOG_LEVEL=info
```

### Paso 3: Obtener API Key de Last.fm (Gratuita)

1. Ve a: https://www.last.fm/api/account/create
2. Crea una cuenta (es gratis)
3. Crea una aplicación:
   - Application name: "Ramona Music"
   - Application type: "Desktop"
4. Copia el **API Key** mostrado
5. Agrégalo al `.env`:

```bash
LASTFM_API_KEY=abc123def456ghi789
```

### Paso 4: Verificar Permisos

Asegúrate que el usuario Docker puede acceder a la carpeta de música:

```bash
# Ver permisos actuales
ls -la /DATA/Media/Music

# Si es necesario, cambiar permisos (en Casa OS):
# Usa la interfaz web de Casa OS para dar permisos
# O desde terminal:
sudo chmod 755 /DATA/Media/Music
```

### Paso 5: Iniciar Ramona Music

```bash
cd /DATA/AppData/ramona-music

# Iniciar en segundo plano
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f
```

### Paso 6: Acceder a la Aplicación

Abre tu navegador y accede a:

```
http://tu-servidor-casa-os:3000
```

O si estás en el mismo servidor:

```
http://localhost:3000
```

Deberías ver la interfaz de Ramona Music con el tema oscuro.

## ✅ Verificar que Todo Funciona

### 1. Backend está activo

```bash
curl http://localhost:3001/health
```

Deberías recibir:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 2. Descargar una canción de prueba

1. En Ramona Music, busca cualquier canción en YouTube
2. Haz click en descargar
3. Espera a que se complete (puede tomar 30 segundos)
4. La canción debería aparecer en Navidrome

### 3. Verificar carpeta de música

```bash
ls -la /DATA/Media/Music/
```

Deberías ver nuevas carpetas de artistas con archivos MP3.

## 🔧 Configuración Avanzada

### Cambiar Puerto

Si el puerto 3000 o 3001 está en uso:

Edita `docker-compose.yml`:

```yaml
services:
  web:
    ports:
      - "3002:80"  # Cambiar primer número
  
  backend:
    ports:
      - "3002:3001"  # Cambiar primer número
```

Luego reinicia:

```bash
docker-compose down
docker-compose up -d
```

### Usar NAS en lugar de almacenamiento local

Si tu música está en un NAS:

```bash
# .env
MUSIC_PATH=/mnt/nas/music

# Asegúrate que el NAS está montado en /mnt/nas
mount -t nfs 192.168.1.100:/volumen1/music /mnt/nas/music
```

### Hacer Ramona Music accesible desde fuera

**Opción 1: Usar Reverse Proxy (recomendado)**

Si usas nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

**Opción 2: Port Forwarding en Router**

1. Abre puerto 3000 en tu router
2. Reenvía al puerto 3000 de tu servidor
3. Usa tu IP pública o DynamicDNS

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
docker-compose logs -f backend
# O
docker-compose logs -f web
```

### Verificar uso de recursos

```bash
docker stats ramona-music-backend ramona-music-web
```

### Estadísticas de descargas

En la interfaz, ve a **Downloads** para ver:
- Canciones descargadas recientemente
- Progreso de descargas en curso
- Historial

## 🔄 Actualizar Ramona Music

Cuando hay nueva versión:

```bash
cd /DATA/AppData/ramona-music

# Descargar cambios
git pull

# Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🛑 Detener o Reiniciar

```bash
# Detener completamente
docker-compose down

# Reiniciar
docker-compose restart

# Reiniciar solo un servicio
docker-compose restart backend
```

## 🐛 Solución de Problemas

### "Connection refused" al acceder a 3000

```bash
# Verificar que containers están corriendo
docker-compose ps

# Ver logs
docker-compose logs web
```

### Música no aparece en Navidrome

```bash
# Verificar que se descargó
ls -la /DATA/Media/Music/

# Rescannear biblioteca en Navidrome:
# Abre Navidrome > Configuración > Rescannear biblioteca
```

### Error de permisos en carpeta de música

```bash
# Verificar permisos
ls -la /DATA/Media/Music

# Dar permisos necesarios
sudo chown nobody:nogroup /DATA/Media/Music
sudo chmod 755 /DATA/Media/Music
```

### Backend no responde

```bash
# Reiniciar backend
docker-compose restart backend

# Ver logs
docker-compose logs backend

# Reconstruir si está corrupto
docker-compose build --no-cache backend
docker-compose up -d
```

### Llenar disco con descargas

Las descargas temporales se almacenan en:
```bash
/DATA/AppData/ramona-music/downloads/
```

Limpiar si es necesario:
```bash
rm -rf /DATA/AppData/ramona-music/downloads/*
```

## 🔐 Seguridad

### 1. Cambiar contraseñas por defecto

En `docker-compose.yml` si las hay (revisa antes de ejecutar).

### 2. Restringir acceso por firewall

```bash
# Solo acceso desde red local
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

### 3. Usar HTTPS

Usa un certificado SSL con Let's Encrypt:

```bash
sudo certbot certonly --standalone -d tu-dominio.com
# Luego configura en tu reverse proxy
```

## 📈 Performance

Si la descarga es lenta:

1. **Verificar velocidad de internet:**
   ```bash
   speedtest-cli
   ```

2. **Verificar recursos del servidor:**
   ```bash
   docker stats
   top
   df -h  # Espacio en disco
   ```

3. **Aumentar recursos de Docker** en `/etc/docker/daemon.json`

4. **Usar mejor calidad de audio:**
   En Ramona Music > Ajustes, selecciona calidad "High" en lugar de "Maximum"

## 📞 Soporte

- Documentación: Ver `/docs` en el repositorio
- Reportar bugs: GitHub Issues
- Comunidad: GitHub Discussions

---

**¡Felicidades! Ya tienes Ramona Music corriendo en tu Casa OS! 🎵**
