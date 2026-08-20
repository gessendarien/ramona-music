#!/bin/bash
set -e

# Change to the directory where the script is located (root)
cd "$(dirname "$0")"
ROOT_DIR=$(pwd)

echo "Building Android APK..."

WORKSPACE="$ROOT_DIR/.android-env"

# Setup Android SDK if not present
if [ ! -d "$WORKSPACE/java" ] || [ ! -d "$WORKSPACE/sdk" ]; then
  echo "Setting up Android environment..."
  mkdir -p "$WORKSPACE/java"
  cd "$WORKSPACE/java"
  if [ ! -d "jdk-17.0.10+7" ]; then
    curl -s -L -o jdk.tar.gz "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.10_7.tar.gz"
    tar -xzf jdk.tar.gz
    rm jdk.tar.gz
  fi

  export JAVA_HOME="$WORKSPACE/java/jdk-17.0.10+7"
  export PATH="$JAVA_HOME/bin:$PATH"

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

  echo "Accepting licenses and installing SDK packages..."
  yes | sdkmanager --licenses > /dev/null
  sdkmanager "platform-tools" "platforms;android-33" "platforms;android-34" "build-tools;33.0.0" "build-tools;34.0.0" > /dev/null
  
  cd "$ROOT_DIR"
fi

# Set environment
export JAVA_HOME="$WORKSPACE/java/jdk-17.0.10+7"
export ANDROID_HOME="$WORKSPACE/sdk"
export PATH="$JAVA_HOME/bin:$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Clean Expo prebuild
echo "Cleaning and regenerating Android project..."
cd mobile
npx expo prebuild --clean --platform android

# Build APK
echo "Compiling APK..."
cd android
chmod +x gradlew
./gradlew assembleDebug

cd ../..

echo "Copying APK to output directory..."
mkdir -p output
cp mobile/android/app/build/outputs/apk/debug/app-debug.apk output/RamonaMusic.apk

echo "Build complete. APK is located at: $ROOT_DIR/output/RamonaMusic.apk"
