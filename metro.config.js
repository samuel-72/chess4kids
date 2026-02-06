// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable require.context for expo-router (required for file-based routing)
config.transformer = {
    ...config.transformer,
    unstable_allowRequireContext: true,
};

module.exports = config;
