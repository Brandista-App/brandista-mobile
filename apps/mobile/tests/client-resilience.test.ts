import { createClient } from '../src/lib/client'

afterEach(() => jest.useRealTimers())
test('20-second network timeout aborts transport and releases the timer without leaking details', async () => {
  jest.useFakeTimers()
  let signal: AbortSignal | undefined
  const transport = jest.fn((_url, options) => {
    signal = options.signal
    return new Promise<Response>((_resolve, reject) =>
      signal!.addEventListener('abort', () => reject(new Error('private network detail'))),
    )
  })
  const request = createClient(
    'https://api.example.invalid/api/v1',
    () => null,
    jest.fn(),
    transport,
  )
  const assertion = expect(request('/products')).rejects.toMatchObject({
    status: 0,
    message: 'Could not reach Brandista. Check your connection and retry.',
  })
  await jest.advanceTimersByTimeAsync(20000)
  await assertion
  expect(signal?.aborted).toBe(true)
  expect(jest.getTimerCount()).toBe(0)
})
test('protected 401 identifies the token actually sent, not a subsequently changed token', async () => {
  let token = 'older-token'
  const expired = jest.fn()
  const request = createClient(
    'https://api.example.invalid',
    () => token,
    expired,
    jest.fn(async () => {
      token = 'new-token'
      return { status: 401, ok: false, json: async () => ({ message: 'Unauthorized' }) } as Response
    }),
  )
  await expect(request('/customers/me/cart')).rejects.toMatchObject({ status: 401 })
  expect(expired).toHaveBeenCalledWith('older-token')
})
test('malformed successful JSON is rejected rather than treated as catalogue data', async () => {
  const request = createClient(
    'https://api.example.invalid',
    () => null,
    jest.fn(),
    jest.fn(
      async () =>
        ({
          status: 200,
          ok: true,
          json: async () => {
            throw new Error('private parser detail')
          },
        }) as unknown as Response,
    ),
  )
  await expect(request('/products')).rejects.toMatchObject({
    status: 502,
    message: 'Brandista returned an unreadable response.',
  })
})
