#!/bin/bash

echo "🎶 Iniciando Ramona Music (Web + Backend)..."

# Check required external dependencies
MISSING=""
command -v yt-dlp >/dev/null 2>&1 || MISSING="$MISSING yt-dlp"
command -v ffmpeg >/dev/null 2>&1 || MISSING="$MISSING ffmpeg"
command -v deno >/dev/null 2>&1 || MISSING="$MISSING deno"

if [ -n "$MISSING" ]; then
    echo "⚠️  Dependencias faltantes:$MISSING"
    echo "   Las descargas de YouTube pueden fallar sin estas herramientas."
    echo "   Instálalas o usa Docker (docker-compose up) para incluirlas automáticamente."
fi

# 1. Instalar dependencias del backend si no están instaladas
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

# 2. Instalar dependencias del frontend web si no están instaladas
if [ ! -d "web/node_modules" ]; then
    echo "📦 Instalando dependencias del frontend (web)..."
    cd web && npm install && cd ..
fi

# 3. Levantar backend en segundo plano
echo "🚀 Levantando backend..."
npm run dev --prefix backend &
BACKEND_PID=$!

# 4. Levantar frontend web en segundo plano
echo "🚀 Levantando frontend web..."
npm run dev --prefix web &
WEB_PID=$!

echo "✅ Ambos servicios están corriendo."
echo "👉 Abre http://localhost:3000 en tu navegador."
echo "❌ Presiona Ctrl+C para detener ambos servicios."

# Atrapar la señal de salida para detener los procesos hijos
trap "echo '🛑 Deteniendo servicios...'; kill $BACKEND_PID $WEB_PID; exit" SIGINT SIGTERM EXIT

# Esperar indefinidamente hasta que el usuario decida salir
wait
