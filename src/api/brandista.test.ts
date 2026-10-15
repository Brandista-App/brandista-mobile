import { afterEach, expect, it, vi } from 'vitest'
import { discoverBrands } from './brandista'
afterEach(() => vi.unstubAllGlobals())
it('maps the backend unpaginated brand array to the storefront page model', async () => {
  const brands = [{ id: 1, name: 'SAMPLE Studio', slug: 'sample-studio' }]
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(brands))))
  await expect(discoverBrands()).resolves.toEqual({ content: brands, page: 0, size: 1, totalElements: 1, totalPages: 1 })
})
it('maps an empty backend brand array', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]')))
  await expect(discoverBrands()).resolves.toMatchObject({ content: [], totalElements: 0, totalPages: 0 })
})
it('rejects an unexpected brand contract rather than showing an endless loader', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"content":[]}')))
  await expect(discoverBrands()).rejects.toThrow('invalid brand list')
})