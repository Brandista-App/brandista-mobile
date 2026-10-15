import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
if (!process.env.ANDROID_HOME || !existsSync(process.env.ANDROID_HOME)) {
  console.error(
    'Android SDK unavailable. Install it and set ANDROID_HOME; see docs/mobile/ANDROID-BUILD-GUIDE.md.',
  )
  process.exit(1)
}
process.env.APP_VARIANT = 'development'
process.env.EXPO_PUBLIC_API_BASE_URL ||= 'http://10.0.2.2:8082/api/v1'
const windows = process.platform === 'win32'
const prebuild = spawnSync(
  windows ? 'npx.cmd' : 'npx',
  ['expo', 'prebuild', '--platform', 'android'],
  { stdio: 'inherit', shell: windows },
)
if (prebuild.error || prebuild.status !== 0) process.exit(prebuild.status || 1)
const build = spawnSync(windows ? 'gradlew.bat' : './gradlew', ['assembleDebug'], {
  cwd: 'android',
  stdio: 'inherit',
  shell: windows,
})
if (build.error || build.status !== 0) process.exit(build.status || 1)
console.log('APK: android/app/build/outputs/apk/debug/app-debug.apk')
