#!/bin/bash

cleanup() {
    echo -e "\n🛑 Deteniendo los servidores..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $MOBILE_PID 2>/dev/null
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "📦 Iniciando Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del backend..."
    npm install
fi
npm run dev &
BACKEND_PID=$!
cd ..

echo "🎨 Iniciando Frontend Web (React / Vite)..."
cd web
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del frontend..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo "📱 Iniciando Aplicación Móvil (Android)..."
cd mobile
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de mobile..."
    npm install
fi
rm -rf .expo
npx expo start --android --offline &
MOBILE_PID=$!
cd ..

echo "======================================================="
echo "🚀 Backend corriendo en:   http://localhost:3001"
echo "🎨 Frontend corriendo en:  http://localhost:5173"
echo "📱 Expo Android lanzando en el emulador..."
echo "======================================================="
echo "Presiona Ctrl+C para detener todo."

wait $BACKEND_PID $FRONTEND_PID $MOBILE_PID
