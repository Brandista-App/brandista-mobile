import { createClient, ApiError } from '../src/lib/client'
import { createApi } from '../src/lib/api'
const response = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body }) as Response

test('customer identity and checkout adapters follow inspected Spring contracts without invented profile endpoints', async () => {
  const transport = jest.fn().mockResolvedValue(response(200, {}))
  const api = createApi(
    createClient(
      'https://api.example.invalid/api/v1',
      () => 'test-token',
      () => {},
      transport,
    ),
  )
  await api.register('buyer@example.invalid', 'test-password-only')
  await api.login('buyer@example.invalid', 'test-password-only')
  await api.saveAddress({
    recipientName: 'Test',
    phoneNumber: '+923001234567',
    addressLine1: 'Test',
    city: 'Lahore',
    province: 'Punjab',
  })
  await api.review(12)
  await api.order('7')
  const requests = transport.mock.calls.map(([url, options]) => ({
    path: new URL(url).pathname,
    method: options.method || 'GET',
    body: options.body ? JSON.parse(options.body) : undefined,
  }))
  expect(requests).toEqual([
    {
      path: '/api/v1/registrations',
      method: 'POST',
      body: { email: 'buyer@example.invalid', password: 'test-password-only' },
    },
    {
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'buyer@example.invalid', password: 'test-password-only' },
    },
    {
      path: '/api/v1/customers/me/addresses',
      method: 'POST',
      body: {
        recipientName: 'Test',
        phoneNumber: '+923001234567',
        addressLine1: 'Test',
        city: 'Lahore',
        province: 'Punjab',
      },
    },
    { path: '/api/v1/customers/me/checkout/preview', method: 'POST', body: { addressId: 12 } },
    { path: '/api/v1/customers/me/orders/7', method: 'GET', body: undefined },
  ])
})
test('cart mutation sends product/quantity only and authenticates', async () => {
  const transport = jest
    .fn()
    .mockResolvedValue(response(201, { items: [], subtotal: 120, currency: 'PKR' }))
  const api = createApi(
    createClient(
      'https://example.invalid/api/v1',
      () => 'test-token',
      () => {},
      transport,
    ),
  )
  await api.add(9, 2)
  const [url, options] = transport.mock.calls[0]
  expect(url.endsWith('/customers/me/cart/items')).toBe(true)
  expect(JSON.parse(options.body)).toEqual({ productId: 9, quantity: 2 })
  expect(options.headers.get('Authorization')).toBe('Bearer test-token')
})
test('order request retains same idempotency key and never sends client totals', async () => {
  const transport = jest.fn().mockResolvedValue(response(201, { id: 5 }))
  const api = createApi(
    createClient(
      'https://example.invalid',
      () => null,
      () => {},
      transport,
    ),
  )
  const input = { addressId: 7, quoteToken: 'a'.repeat(64) }
  await api.place(input, 'same-test-key')
  await api.place(input, 'same-test-key')
  for (const [, options] of transport.mock.calls) {
    expect(options.headers.get('Idempotency-Key')).toBe('same-test-key')
    expect(JSON.parse(options.body)).toEqual(input)
  }
})
test('authenticated 401 identifies the exact sent token for race-safe invalidation', async () => {
  const expired = jest.fn()
  const request = createClient(
    'https://example.invalid',
    () => 'old-test-token',
    expired,
    jest.fn().mockResolvedValue(response(401, { message: 'Expired' })),
  )
  await expect(request('/customers/me/cart')).rejects.toMatchObject({ status: 401 })
  expect(expired).toHaveBeenCalledWith('old-test-token')
})
test('public 401 does not invalidate an unrelated session', async () => {
  const expired = jest.fn()
  const request = createClient(
    'https://example.invalid',
    () => null,
    expired,
    jest.fn().mockResolvedValue(response(401, {})),
  )
  await expect(request('/auth/login')).rejects.toBeInstanceOf(ApiError)
  expect(expired).not.toHaveBeenCalled()
})
test('204 delete succeeds without JSON and stock conflicts retain backend errors', async () => {
  const transport = jest
    .fn()
    .mockResolvedValueOnce(response(204, null))
    .mockResolvedValueOnce(response(409, { message: 'Insufficient stock', fieldErrors: [] }))
  const api = createApi(
    createClient(
      'https://example.invalid',
      () => null,
      () => {},
      transport,
    ),
  )
  await expect(api.remove(5)).resolves.toBeUndefined()
  await expect(api.quantity(5, 3)).rejects.toMatchObject({
    status: 409,
    message: 'Insufficient stock',
  })
})
test('network failures expose a recoverable connection message', async () => {
  const request = createClient(
    'https://example.invalid',
    () => null,
    () => {},
    jest.fn().mockRejectedValue(new Error('private transport details')),
  )
  await expect(request('/products')).rejects.toMatchObject({
    status: 0,
    message: expect.stringContaining('connection'),
  })
})
