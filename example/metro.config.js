// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('expo/metro-config');
const { withDeviceSimulator } = require('react-native-device-simulator/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [...new Set([...(config.watchFolders || []), monorepoRoot])];

// Preview-aware safe areas, text scaling and (web) KeyboardAvoidingView.
module.exports = withDeviceSimulator(config);
