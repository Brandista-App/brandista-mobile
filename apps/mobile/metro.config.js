const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
// Reuse the preserved approved artwork without duplicating the app or image.
config.watchFolders = [...(config.watchFolders || []), path.resolve(__dirname, '../brand-assets')]
// Assets outside the package still use this app's native asset registry/dependencies.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  ...(config.resolver.nodeModulesPaths || []),
]

module.exports = config
