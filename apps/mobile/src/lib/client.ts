export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message)
  }
}
export function createClient(
  base: string,
  token: () => string | null,
  expired: (sentToken: string) => void,
  transport: typeof fetch = fetch,
) {
  return async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const sentToken = token()
    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')
    if (options.body) headers.set('Content-Type', 'application/json')
    if (sentToken) headers.set('Authorization', `Bearer ${sentToken}`)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    let response: Response
    try {
      response = await transport(`${base}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      })
    } catch {
      clearTimeout(timer)
      throw new ApiError(0, 'Could not reach Brandista. Check your connection and retry.')
    }
    if (response.status === 204) {
      clearTimeout(timer)
      return undefined as T
    }
    const body = await response
      .json()
      .catch(() => null)
      .finally(() => clearTimeout(timer))
    if (!response.ok) {
      if (response.status === 401 && sentToken) expired(sentToken)
      throw new ApiError(
        response.status,
        body?.message || 'Request failed. Please retry.',
        Array.isArray(body?.fieldErrors) ? body.fieldErrors : [],
      )
    }
    if (body === null) throw new ApiError(502, 'Brandista returned an unreadable response.')
    return body as T
  }
}
export type Request = ReturnType<typeof createClient>
