export function isPrivateLanHost(host: string): boolean {
  const parts = host.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255))
    return false
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  )
}

export function apiBase(
  value: string | undefined,
  development: boolean,
  internalLan = false,
): string {
  const base = value || (development ? 'http://10.0.2.2:8082/api/v1' : '')
  if (!base) throw new Error('EXPO_PUBLIC_API_BASE_URL is required for release builds.')
  const url = new URL(base)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/api/v1')
    throw new Error('API URL must end in /api/v1 without credentials, query or fragment.')
  if (internalLan && (!isPrivateLanHost(url.hostname) || url.hostname === '10.0.2.2'))
    throw new Error('Internal LAN builds require an actual private IPv4 LAN host.')
  if (url.protocol !== 'https:' && !((development || internalLan) && url.protocol === 'http:'))
    throw new Error('Release API requires HTTPS.')
  if (!development && /^(localhost|127\.|10\.0\.2\.2|\[::1\])/.test(url.hostname))
    throw new Error('Release API cannot use a loopback or emulator host.')
  return base.replace(/\/$/, '')
}
