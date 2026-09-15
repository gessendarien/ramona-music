const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevenir que Metro crashee cuando Gradle borra carpetas en node_modules
// (Error común con Node 20+ y react-native-track-player)
const exclusionList = [
  /.*\/node_modules\/.*\/android\/build\/.*/,
  /.*\/node_modules\/.*\/ios\/build\/.*/,
];

if (config.resolver.blockList) {
  if (Array.isArray(config.resolver.blockList)) {
    config.resolver.blockList = [...config.resolver.blockList, ...exclusionList];
  } else {
    // Si ya es una RegExp
    config.resolver.blockList = [config.resolver.blockList, ...exclusionList];
  }
} else {
  config.resolver.blockList = exclusionList;
}

module.exports = config;
