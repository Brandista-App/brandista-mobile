export function apiBase(value: string | undefined, development: boolean): string {
  const base = value || (development ? 'http://10.0.2.2:8082/api/v1' : '')
  if (!base) throw new Error('EXPO_PUBLIC_API_BASE_URL is required for release builds.')
  const url = new URL(base)
  if (url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/api/v1'))
    throw new Error('API URL must end in /api/v1 without credentials, query or fragment.')
  if (url.protocol !== 'https:' && !(development && url.protocol === 'http:'))
    throw new Error('Release API requires HTTPS.')
  if (!development && /^(localhost|127\.|10\.0\.2\.2|\[::1\])/.test(url.hostname))
    throw new Error('Release API cannot use a loopback or emulator host.')
  return base.replace(/\/$/, '')
}
