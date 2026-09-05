const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-maps') {
      return {
        filePath: path.resolve(__dirname, 'components/web/WebMap.jsx'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'expo-media-library') {
      return {
        filePath: path.resolve(__dirname, 'components/web/WebMediaLibrary.js'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
