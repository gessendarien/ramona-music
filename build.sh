#!/bin/bash
set -e

# Cambiar al directorio raiz del proyecto
cd "$(dirname "$0")"
ROOT_DIR=$(pwd)

echo "=========================================="
echo "Compilando Ramona Music para Linux (AppImage)"
echo "=========================================="

# 1. Comprobar dependencias requeridas
for cmd in node npm python3; do
  if ! command -v $cmd >/dev/null 2>&1; then
    echo "[ERROR] Se requiere '$cmd' pero no esta instalado."
    exit 1
  fi
done

# 2. Obtener version del proyecto
VERSION=$(node -e "try { console.log(require('./desktop/package.json').version); } catch(e) { console.log('0.0.1'); }")
echo "Version: $VERSION"

# 3. Preparar directorios
mkdir -p output
mkdir -p desktop/build/icons

# 4. Procesar y preparar el icono desde la raiz (icon.png)
echo "Procesando icono desde raiz (icon.png)..."
if [ ! -f "icon.png" ]; then
  echo "[ERROR] No se encontro icon.png en la raiz del proyecto."
  exit 1
fi

cp icon.png desktop/icon.png
python3 - << 'EOF'
import os
from PIL import Image

src = 'icon.png'
if os.path.exists(src):
    im = Image.open(src).convert('RGBA')
    # Crear iconos para el AppImage en diferentes resoluciones estandar
    sizes = [16, 24, 32, 48, 64, 128, 256, 512]
    for s in sizes:
        resized = im.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(f'desktop/build/icons/{s}x{s}.png')
    
    # Icono principal de 512x512
    im.resize((512, 512), Image.Resampling.LANCZOS).save('desktop/build/icon.png')
    print("Iconos generados correctamente en desktop/build/icons/")
else:
    print("[ERROR] icon.png no encontrado.")
EOF

# 5. Compilar Web UI (React + Vite)
echo "Compilando frontend web..."
cd web
npm install
npm run build
cd "$ROOT_DIR"

rm -rf desktop/web-dist
cp -R web/dist desktop/web-dist
echo "Frontend web copiado a desktop/web-dist"

# 6. Preparar Backend integrado para distribucion
echo "Preparando backend integrado..."
cd backend
npm install --omit=dev
cd "$ROOT_DIR"

rm -rf desktop/backend
mkdir -p desktop/backend
cp -R backend/src desktop/backend/
cp backend/package.json desktop/backend/
cp -R backend/node_modules desktop/backend/
echo "Backend integrado copiado a desktop/backend"

# 7. Compilar aplicacion de escritorio (Electron AppImage)
echo "Compilando AppImage con electron-builder..."
cd desktop
if [ ! -d "node_modules" ]; then
  npm install
fi

npx electron-builder --linux AppImage
cd "$ROOT_DIR"

# Limpiar archivos temporales de empaquetado en output/
rm -rf output/linux-unpacked output/builder-*.yml output/builder-*.yaml

# 8. Verificar y dar permisos de ejecucion al AppImage resultante
EXPECTED_APPIMAGE="output/RamonaMusic-v$VERSION.AppImage"
if [ -f "$EXPECTED_APPIMAGE" ]; then
  chmod +x "$EXPECTED_APPIMAGE"
  SIZE=$(du -h "$EXPECTED_APPIMAGE" | cut -f1)
  echo "=========================================="
  echo "Compilacion completada exitosamente."
  echo "AppImage generado: $EXPECTED_APPIMAGE ($SIZE)"
  echo "Puedes ejecutarlo con: ./$EXPECTED_APPIMAGE"
  echo "=========================================="
else
  # Buscar cualquier .AppImage generado en output
  FOUND_APPIMAGE=$(ls -t output/*.AppImage 2>/dev/null | head -n 1 || true)
  if [ -n "$FOUND_APPIMAGE" ]; then
    chmod +x "$FOUND_APPIMAGE"
    SIZE=$(du -h "$FOUND_APPIMAGE" | cut -f1)
    echo "=========================================="
    echo "Compilacion completada exitosamente."
    echo "AppImage generado: $FOUND_APPIMAGE ($SIZE)"
    echo "Puedes ejecutarlo con: ./$FOUND_APPIMAGE"
    echo "=========================================="
  else
    echo "[ADVERTENCIA] No se encontro el archivo .AppImage en output/"
    exit 1
  fi
fi
