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

# Run Expo prebuild (without clean to optimize build time)
echo "Generating/updating Android project with Expo (optimized)..."
cd mobile
npx expo prebuild --platform android
cd ..

# Build Web UI
echo "Building Web UI..."
cd web
npm install
npm run build
cd ..

# Copy Web UI to Android Assets
echo "Copying Web UI to Android Assets..."
rm -rf mobile/android/app/src/main/assets/www
mkdir -p mobile/android/app/src/main/assets/www
cp -R web/dist/* mobile/android/app/src/main/assets/www/

# Build APK
echo "Compiling APK..."
cd mobile/android
chmod +x gradlew
./gradlew assembleRelease --no-daemon --parallel -PreactNativeArchitectures=arm64-v8a

cd ../..

echo "Copying APK to output directory..."
mkdir -p output

# Get version from app.json
VERSION=$(node -e "console.log(require('./mobile/app.json').expo.version)")
APK_NAME="RamonaMusic-v$VERSION.apk"

cp mobile/android/app/build/outputs/apk/release/app-release.apk "output/$APK_NAME"

echo "Build complete. APK is located at: $ROOT_DIR/output/$APK_NAME"
