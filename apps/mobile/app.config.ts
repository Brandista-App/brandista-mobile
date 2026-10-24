import type { ExpoConfig } from 'expo/config'
const internalLan = process.env.APP_VARIANT === 'internal-lan'
const internal = process.env.APP_VARIANT === 'internal' || internalLan
if (internalLan !== (process.env.EXPO_PUBLIC_APP_VARIANT === 'internal-lan'))
  throw new Error('Internal LAN build flags must agree.')
const development = process.env.APP_VARIANT === 'development'
const base = process.env.EXPO_PUBLIC_API_BASE_URL
const iosBundleIdentifier = process.env.IOS_BUNDLE_IDENTIFIER
const easProjectId = process.env.EAS_PROJECT_ID
if (iosBundleIdentifier && !/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(iosBundleIdentifier))
  throw new Error('IOS_BUNDLE_IDENTIFIER must be an owner-approved reverse-DNS identifier.')
if (
  easProjectId &&
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(easProjectId)
)
  throw new Error('EAS_PROJECT_ID must be the UUID of the owner-approved Expo project.')
if (process.env.IOS_BUILD === '1' && (!iosBundleIdentifier || !easProjectId))
  throw new Error(
    'iOS builds require owner-approved IOS_BUNDLE_IDENTIFIER and EAS_PROJECT_ID. Expo Go needs neither.',
  )
const endpoint = base ? new URL(base) : undefined
if (
  process.env.IOS_BUILD === '1' &&
  (!endpoint ||
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== '/api/v1' ||
    /^(localhost|127\.|10\.0\.2\.2|\[::1\]|0\.0\.0\.0|\[::\])/.test(endpoint.hostname) ||
    endpoint.hostname.endsWith('.localhost'))
)
  throw new Error('iOS builds require an approved reachable HTTPS API ending in /api/v1.')
if (
  !development &&
  (!endpoint ||
    (endpoint.protocol !== 'https:' && !(internalLan && endpoint.protocol === 'http:')) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== '/api/v1' ||
    /^(localhost|127\.|10\.0\.2\.2|\[::1\])/.test(endpoint.hostname))
)
  throw new Error(
    'Release configuration requires EXPO_PUBLIC_API_BASE_URL using HTTPS. Set APP_VARIANT=development for local Android development.',
  )
if (internalLan) {
  const octets = endpoint!.hostname.split('.').map(Number)
  const privateIp =
    octets.length === 4 &&
    octets.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) &&
    (octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168))
  if (!privateIp || endpoint!.pathname !== '/api/v1')
    throw new Error('Internal LAN requires a private IPv4 /api/v1 endpoint.')
}
const config: ExpoConfig = {
  name: internalLan
    ? 'Brandista LAN'
    : internal
      ? 'Brandista Internal'
      : development
        ? 'Brandista Dev'
        : 'Brandista',
  slug: 'brandista-mobile',
  version: '0.2.0',
  icon: '../brand-assets/brandista-approved-logo.jpeg.jpeg',
  scheme: 'brandista',
  orientation: 'default',
  userInterfaceStyle: 'light',
  platforms: ['android', 'ios'],
  ...(iosBundleIdentifier ? { ios: { bundleIdentifier: iosBundleIdentifier } } : {}),
  ...(easProjectId ? { extra: { eas: { projectId: easProjectId } } } : {}),
  android: {
    package: internal
      ? 'com.brandista.mobile.internal'
      : development
        ? 'com.brandista.mobile.dev'
        : 'com.brandista.mobile',
    versionCode: 2,
    permissions: [],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.CAMERA',
      'android.permission.VIBRATE',
      ...(!development ? ['android.permission.SYSTEM_ALERT_WINDOW'] : []),
    ],
    softwareKeyboardLayoutMode: 'resize',
    predictiveBackGestureEnabled: true,
  },
  plugins: [
    'expo-router',
    'expo-image',
    'expo-status-bar',
    './plugins-internal-signing.cjs',
    './plugins-lan-network.cjs',
    ['expo-secure-store', { configureAndroidBackup: true }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FAF6EF',
        image: '../brand-assets/brandista-approved-logo.jpeg.jpeg',
        imageWidth: 180,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: development,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '37.0.0',
        },
      },
    ],
  ],
  experiments: { typedRoutes: true },
}
export default config
