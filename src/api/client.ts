const baseUrl = (import.meta.env['VITE_API_BASE_URL'] || 'http://localhost:8080/api/v1').replace(
  /\/$/,
  '',
)
let accessToken: string | null = null
export function setAccessToken(token: string | null) {
  accessToken = token
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'We could not reach Brandista. Check your connection and try again.')
  }
  if (response.status === 204) return undefined as T
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    throw new ApiError(
      response.status,
      typeof error['message'] === 'string'
        ? error['message']
        : 'Something went wrong. Please try again.',
      Array.isArray(error['fieldErrors'])
        ? (error['fieldErrors'] as { field: string; message: string }[])
        : [],
    )
  }
  return body as T
}
export const jsonBody = (body: unknown) => JSON.stringify(body)
