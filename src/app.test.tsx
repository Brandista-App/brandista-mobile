/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { App } from './app'

beforeEach(() => {
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('keeps navigation usable when catalogue requests fail', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network unavailable')))
  render(<App />)

  expect(await screen.findByRole('heading', { name: /Good finds/ })).toBeVisible()
  expect(await screen.findAllByRole('alert')).toHaveLength(2)
  expect(
    screen
      .getAllByRole('alert')
      .every((alert) => alert.textContent?.includes('We could not reach Brandista')),
  ).toBe(true)

  const menu = screen.getByRole('button', { name: /Toggle menu/ })
  fireEvent.click(menu)
  expect(menu).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', {
      name: 'Our brands',
    }),
  )

  expect(await screen.findByRole('heading', { name: 'Meet the makers' })).toBeVisible()
  expect(await screen.findByRole('alert')).toHaveTextContent('We could not reach Brandista')
})

const categoryPage = {
  content: [{ id: 7, name: 'Clothing', slug: 'clothing' }],
  page: 0,
  size: 50,
  totalElements: 1,
  totalPages: 1,
}
const product = {
  id: 42,
  name: 'Linen Shirt',
  slug: 'linen-shirt',
  description: 'A breathable everyday shirt.',
  brandId: 3,
  brandName: 'Example Atelier',
  categoryId: 7,
  categoryName: 'Clothing',
  price: 1299.95,
  currency: 'PKR',
  availability: 'AVAILABLE',
}
function productPage(page = 0) {
  return {
    content: [product],
    page,
    size: 12,
    totalElements: 13,
    totalPages: 2,
  }
}
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

it('loads and filters the documented catalogue, paginates, and opens a product', async () => {
  const requests: URL[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      requests.push(url)
      if (url.pathname.endsWith('/categories')) return jsonResponse(categoryPage)
      if (url.pathname.endsWith('/brands'))
        return jsonResponse({
          content: [
            {
              id: 3,
              name: 'Example Atelier',
              slug: 'example-atelier',
              description: 'Made in Lahore.',
            },
          ],
          page: 0,
          size: 50,
          totalElements: 1,
          totalPages: 1,
        })
      if (url.pathname.endsWith('/products/linen-shirt')) return jsonResponse(product)
      if (url.pathname.endsWith('/products')) {
        const requestedPage = Number(url.searchParams.get('page') || 0)
        return jsonResponse(productPage(requestedPage))
      }
      return jsonResponse({ message: 'Unexpected endpoint' }, 404)
    }),
  )
  render(<App />)

  expect(await screen.findByRole('link', { name: 'Linen Shirt' })).toBeVisible()
  expect(await screen.findByRole('heading', { name: 'Makers to know' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Example Atelier' })).toBeVisible()
  fireEvent.change(screen.getByRole('textbox', { name: 'Search products' }), {
    target: { value: 'linen' },
  })
  fireEvent.submit(screen.getByRole('search'))
  expect(await screen.findByRole('heading', { name: 'Find your next favourite' })).toBeVisible()
  const category = await screen.findByRole('combobox', { name: 'Category' })
  fireEvent.change(category, { target: { value: '7' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), {
    target: { value: 'price_asc' },
  })
  await screen.findByText('Page 1 of 2')
  fireEvent.click(screen.getByRole('button', { name: 'Next →' }))
  await screen.findByText('Page 2 of 2')

  const catalogCalls = requests.filter((url) => url.pathname.endsWith('/products'))
  expect(catalogCalls.some((url) => url.searchParams.get('categoryId') === '7')).toBe(true)
  expect(catalogCalls.some((url) => url.searchParams.get('keyword') === 'linen')).toBe(true)
  expect(catalogCalls.some((url) => url.searchParams.get('sort') === 'price_asc')).toBe(true)
  expect(catalogCalls.some((url) => url.searchParams.get('page') === '1')).toBe(true)
  expect(
    catalogCalls
      .filter((url) => url.searchParams.has('page'))
      .every((url) => url.searchParams.get('size') === '12'),
  ).toBe(true)

  fireEvent.click(screen.getByRole('link', { name: 'Linen Shirt' }))
  expect(await screen.findByRole('heading', { name: 'Linen Shirt' })).toBeVisible()
  expect(await screen.findByText('A breathable everyday shirt.')).toBeVisible()
  expect(requests.some((url) => url.pathname.endsWith('/products/linen-shirt'))).toBe(true)
})

it('allows retrying a failed product detail request', async () => {
  let detailRequests = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/categories'))
        return jsonResponse({ ...categoryPage, content: [] })
      if (url.pathname.endsWith('/brands'))
        return jsonResponse({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 })
      if (url.pathname.endsWith('/products/linen-shirt')) {
        detailRequests += 1
        return detailRequests === 1
          ? jsonResponse({ message: 'Catalogue temporarily unavailable' }, 503)
          : jsonResponse(product)
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(productPage())
      return jsonResponse({ message: 'Unexpected endpoint' }, 404)
    }),
  )
  render(<App />)

  fireEvent.click(await screen.findByRole('link', { name: 'Linen Shirt' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue temporarily unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('heading', { name: 'Linen Shirt' })).toBeVisible()
  expect(detailRequests).toBe(2)
})
