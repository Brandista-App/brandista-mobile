import type { ExpoConfig } from 'expo/config'
const development = process.env.APP_VARIANT === 'development'
const base = process.env.EXPO_PUBLIC_API_BASE_URL
const endpoint = base ? new URL(base) : undefined
if (
  !development &&
  (!endpoint ||
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    !endpoint.pathname.endsWith('/api/v1') ||
    /^(localhost|127\.|10\.0\.2\.2|\[::1\])/.test(endpoint.hostname))
)
  throw new Error(
    'Release configuration requires EXPO_PUBLIC_API_BASE_URL using HTTPS. Set APP_VARIANT=development for local Android development.',
  )
const config: ExpoConfig = {
  name: development ? 'Brandista Dev' : 'Brandista',
  slug: 'brandista-mobile',
  version: '0.1.0',
  scheme: 'brandista',
  orientation: 'default',
  userInterfaceStyle: 'light',
  platforms: ['android', 'ios'],
  android: {
    package: development ? 'com.brandista.mobile.dev' : 'com.brandista.mobile',
    versionCode: 1,
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
    ['expo-secure-store', { configureAndroidBackup: true }],
    ['expo-splash-screen', { backgroundColor: '#F7F3EB' }],
    ['expo-build-properties', { android: { usesCleartextTraffic: development } }],
  ],
  experiments: { typedRoutes: true },
}
export default config
