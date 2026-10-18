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
  platform = 'android',
  environment?: string,
): string {
  if (environment && !['development', 'staging', 'production'].includes(environment))
    throw new Error('Select development, staging, or production for EXPO_PUBLIC_APP_ENV.')
  const strict =
    !development || platform === 'ios' || environment === 'staging' || environment === 'production'
  if (internalLan && (environment === 'staging' || environment === 'production'))
    throw new Error('Staging and production require HTTPS, without an internal-LAN override.')
  if (platform === 'ios' && internalLan)
    throw new Error('The Android internal-LAN variant is not an iOS configuration. Use HTTPS.')
  const base = value || (!strict ? 'http://10.0.2.2:8082/api/v1' : '')
  if (platform === 'ios' && !base)
    throw new Error(
      'Set EXPO_PUBLIC_API_BASE_URL to your approved HTTPS API ending in /api/v1, then restart Expo.',
    )
  if (!base) throw new Error('EXPO_PUBLIC_API_BASE_URL is required for release builds.')
  const url = new URL(base)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/api/v1')
    throw new Error('API URL must end in /api/v1 without credentials, query or fragment.')
  if (internalLan && (!isPrivateLanHost(url.hostname) || url.hostname === '10.0.2.2'))
    throw new Error('Internal LAN builds require an actual private IPv4 LAN host.')
  if (
    url.protocol !== 'https:' &&
    !(((!strict && development) || (internalLan && platform !== 'ios')) && url.protocol === 'http:')
  )
    throw new Error('Release API requires HTTPS.')
  if (strict && /^(localhost|127\.|10\.0\.2\.2|\[::1\])/.test(url.hostname))
    throw new Error('Release API cannot use a loopback or emulator host.')
  if (
    platform === 'ios' &&
    (url.hostname === '0.0.0.0' || url.hostname === '[::]' || url.hostname.endsWith('.localhost'))
  )
    throw new Error('An iPhone requires a reachable API host, not a local bind address.')
  return base.replace(/\/$/, '')
}

export function resolveApiConfig(
  value: string | undefined,
  development: boolean,
  internalLan = false,
  platform = 'android',
  environment?: string,
): { base: string; error: Error | null } {
  try {
    return { base: apiBase(value, development, internalLan, platform, environment), error: null }
  } catch (error) {
    return {
      base: '',
      error: error instanceof Error ? error : new Error('API configuration is invalid.'),
    }
  }
}
