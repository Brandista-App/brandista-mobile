const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins')
const fs = require('node:fs/promises')
const path = require('node:path')

module.exports = function withLanNetwork(config) {
  if (process.env.APP_VARIANT !== 'internal-lan') return config
  const host = new URL(process.env.EXPO_PUBLIC_API_BASE_URL).hostname
  config = withAndroidManifest(config, (mod) => {
    mod.modResults.manifest.application[0].$['android:networkSecurityConfig'] =
      '@xml/brandista_lan_network'
    return mod
  })
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const directory = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml')
      await fs.mkdir(directory, { recursive: true })
      await fs.writeFile(
        path.join(directory, 'brandista_lan_network.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">${host}</domain>
  </domain-config>
</network-security-config>
`,
      )
      return mod
    },
  ])
}
