const { withAppBuildGradle } = require('expo/config-plugins')

// CNG plugin: credentials are read by Gradle at build time, never written here.
module.exports = function withInternalSigning(config) {
  if (process.env.BRANDISTA_INTERNAL_BUILD !== '1') return config
  return withAppBuildGradle(config, (mod) => {
    const marker = '    signingConfigs {'
    const release = /(release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/
    if (!mod.modResults.contents.includes(marker) || !release.test(mod.modResults.contents))
      throw new Error('Android template changed: internal signing must be reviewed.')
    mod.modResults.contents = mod.modResults.contents
      .replace(
        marker,
        `${marker}
        internal {
            def required = { name ->
                def value = System.getenv(name)
                if (!value) throw new GradleException("Missing internal signing environment: " + name)
                return value
            }
            storeFile file(required('BRANDISTA_KEYSTORE_PATH'))
            storePassword required('BRANDISTA_STORE_PASSWORD')
            keyAlias required('BRANDISTA_KEY_ALIAS')
            keyPassword required('BRANDISTA_KEY_PASSWORD')
        }`,
      )
      .replace(release, '$1signingConfig signingConfigs.internal')
    return mod
  })
}
