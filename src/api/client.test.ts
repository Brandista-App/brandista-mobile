import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, hasAccessToken, setAccessToken } from './client'
describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })
  it('sends the in-memory bearer token and parses JSON', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', f)
    setAccessToken('test-token')
    await expect(apiRequest('/x')).resolves.toEqual({ ok: true })
    expect((f.mock.calls[0]?.[1]?.headers as Headers).get('Authorization')).toBe(
      'Bearer test-token',
    )
  })
  it('normalizes backend validation failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            '{"message":"Invalid","fieldErrors":[{"field":"email","message":"Required"}]}',
            { status: 400 },
          ),
        ),
    )
    await expect(apiRequest('/x')).rejects.toMatchObject({
      status: 400,
      message: 'Invalid',
      fieldErrors: [{ field: 'email', message: 'Required' }],
    })
  })
  it('clears the in-memory token after an unauthorized protected response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"message":"Unauthorized"}', { status: 401 })),
    )
    setAccessToken('expired-test-token')
    await expect(apiRequest('/customers/me/cart')).rejects.toMatchObject({ status: 401 })
    expect(hasAccessToken()).toBe(false)
  })
  it('returns a safe message for network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret network detail')))
    await expect(apiRequest('/x')).rejects.toMatchObject({
      status: 0,
      message: 'We could not reach Brandista. Check your connection and try again.',
    })
  })
})
