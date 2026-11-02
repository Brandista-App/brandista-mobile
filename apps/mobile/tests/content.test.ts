import { contentDestination } from '../src/lib/content'
import { createApi } from '../src/lib/api'
import { createClient } from '../src/lib/client'
test('requests only the published mobile document', async () => {
  const transport = jest
    .fn()
    .mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ banners: [], sections: [], brandIds: [], collectionIds: [] }),
    })
  const client = createApi(
    createClient(
      'https://api.example.invalid/api/v1',
      () => null,
      () => {},
      transport,
    ),
  )
  await client.homepage()
  expect(transport.mock.calls[0][0]).toBe(
    'https://api.example.invalid/api/v1/content/homepage?target=MOBILE',
  )
})
test('maps the shared destination vocabulary into native routes', () => {
  expect(contentDestination('/products')).toBe('/catalogue')
  expect(contentDestination('/products?categoryId=8')).toBe('/catalogue?categoryId=8')
  expect(contentDestination('/products?brandId=9')).toBe('/catalogue?brandId=9')
  expect(contentDestination('/brands')).toBe('/brands')
  for (const value of [
    'javascript:alert(1)',
    '//evil.test',
    'https://evil.test',
    '/products?brandId=0',
  ])
    expect(contentDestination(value)).toBeNull()
})
