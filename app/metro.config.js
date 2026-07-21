const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: path.resolve(__dirname, 'node_modules/buffer'),
};

// Disable unstable package exports to fix resolution issues with packages like react-native-svg
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
