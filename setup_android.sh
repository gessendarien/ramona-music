#!/bin/bash
set -e

WORKSPACE="/home/gess/Documentos/Dev/Ramona/ramona-music/.android-env"
mkdir -p "$WORKSPACE"

# Descargar e instalar Java 17 localmente
echo "==== Descargando e instalando Java (OpenJDK 17) ===="
mkdir -p "$WORKSPACE/java"
cd "$WORKSPACE/java"
if [ ! -d "jdk-17.0.10+7" ]; then
  curl -s -L -o jdk.tar.gz "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.10_7.tar.gz"
  tar -xzf jdk.tar.gz
  rm jdk.tar.gz
fi

export JAVA_HOME="$WORKSPACE/java/jdk-17.0.10+7"
export PATH="$JAVA_HOME/bin:$PATH"

echo "==== Versión de Java instalada ===="
java -version

# Descargar e instalar Android SDK
echo "==== Descargando Android SDK Command Line Tools ===="
mkdir -p "$WORKSPACE/sdk/cmdline-tools"
cd "$WORKSPACE/sdk/cmdline-tools"

if [ ! -d "latest" ]; then
  curl -s -o cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip"
  unzip -q cmdline-tools.zip
  rm cmdline-tools.zip
  mv cmdline-tools latest
fi

export ANDROID_HOME="$WORKSPACE/sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"

echo "==== Instalando plataformas de Android SDK ===="
yes | sdkmanager --licenses > /dev/null
sdkmanager "platform-tools" "platforms;android-33" "platforms;android-34" "build-tools;33.0.0" "build-tools;34.0.0" > /dev/null

export PATH="$PATH:$ANDROID_HOME/platform-tools"

echo "==== Escribiendo el archivo env.sh para el futuro ===="
cat <<EOF > /home/gess/Documentos/Dev/Ramona/ramona-music/env_android.sh
export JAVA_HOME="$WORKSPACE/java/jdk-17.0.10+7"
export ANDROID_HOME="$WORKSPACE/sdk"
export PATH="\$JAVA_HOME/bin:\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools"
EOF

echo "==== Construyendo el APK Nativo de Ramona Music ===="
cd /home/gess/Documentos/Dev/Ramona/ramona-music/mobile/android
chmod +x gradlew
./gradlew assembleDebug

echo "==== Copiando APK a la carpeta principal ===="
cp app/build/outputs/apk/debug/app-debug.apk /home/gess/Documentos/Dev/Ramona/ramona-music/RamonaMusic.apk

echo "==== ¡Todo listo! El APK está en RamonaMusic.apk ===="
