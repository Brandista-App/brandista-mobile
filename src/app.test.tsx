/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { App } from './app'
import { hasAccessToken, setAccessToken } from './api/client'

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  setAccessToken(null)
})

afterEach(() => {
  cleanup()
  setAccessToken(null)
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
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', {
      name: 'Shop all',
    }),
  )
  expect(await screen.findByRole('heading', { name: 'Find your next favourite' })).toBeVisible()
  expect(await screen.findByRole('button', { name: 'Try again' })).toBeVisible()
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
  expect(screen.getByRole('textbox', { name: 'Search products' })).toHaveValue('linen')
  const category = await screen.findByRole('combobox', { name: 'Category' })
  fireEvent.change(category, { target: { value: '7' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Brand' }), {
    target: { value: '3' },
  })
  fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), {
    target: { value: 'price_asc' },
  })
  await screen.findByText('Page 1 of 2')
  fireEvent.click(screen.getByRole('button', { name: 'Next →' }))
  await screen.findByText('Page 2 of 2')

  const catalogCalls = requests.filter((url) => url.pathname.endsWith('/products'))
  expect(catalogCalls.some((url) => url.searchParams.get('categoryId') === '7')).toBe(true)
  expect(catalogCalls.some((url) => url.searchParams.get('brandId') === '3')).toBe(true)
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

it('shows an empty search result and clears active search filters', async () => {
  window.history.replaceState({}, '', '/products?keyword=not-found')
  const requests: URL[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      requests.push(url)
      if (url.pathname.endsWith('/categories'))
        return jsonResponse({ ...categoryPage, content: [] })
      if (url.pathname.endsWith('/brands'))
        return jsonResponse({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 })
      if (url.pathname.endsWith('/products'))
        return jsonResponse({ content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 })
      return jsonResponse({ message: 'Unexpected endpoint' }, 404)
    }),
  )
  render(<App />)

  expect(await screen.findByRole('heading', { name: 'No finds just yet' })).toBeVisible()
  expect(requests.some((url) => url.searchParams.get('keyword') === 'not-found')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  await screen.findByRole('heading', { name: 'No finds just yet' })
  expect(
    requests.some((url) => url.pathname.endsWith('/products') && !url.searchParams.has('keyword')),
  ).toBe(true)
})

it('explains when a product slug does not exist', async () => {
  window.history.replaceState({}, '', '/products/missing-product')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(jsonResponse({ message: 'Product not found' }, 404)),
  )
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent('This find is no longer available.')
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible()
})

it('submits the selected quantity to the authenticated cart endpoint', async () => {
  window.history.replaceState({}, '', '/sign-in')
  let cartRequest: { url: URL; init?: RequestInit } | undefined
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/auth/login'))
        return jsonResponse({
          accessToken: 'test-access-token',
          tokenType: 'Bearer',
          expiresIn: 900,
          account: { id: 10, email: 'shopper@example.com', role: 'CUSTOMER' },
        })
      if (url.pathname.endsWith('/categories')) return jsonResponse(categoryPage)
      if (url.pathname.endsWith('/brands'))
        return jsonResponse({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 })
      if (url.pathname.endsWith('/products/linen-shirt')) return jsonResponse(product)
      if (url.pathname.endsWith('/products')) return jsonResponse(productPage())
      if (url.pathname.endsWith('/customers/me/cart/items')) {
        cartRequest = { url, init }
        return jsonResponse({ id: 1, items: [], subtotal: 0, currency: 'PKR' }, 201)
      }
      return jsonResponse({ message: 'Unexpected endpoint' }, 404)
    }),
  )
  render(<App />)

  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'shopper@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'not-a-real-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('heading', { name: 'Hello, shopper.' })).toBeVisible()
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', {
      name: 'Shop all',
    }),
  )
  fireEvent.click(await screen.findByRole('link', { name: 'Linen Shirt' }))
  await screen.findByRole('heading', { name: 'Linen Shirt' })
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantity' }), {
    target: { value: '3' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add to your bag ↗' }))
  expect(await screen.findByText('Added to your bag.')).toBeVisible()
  expect(cartRequest?.url.pathname).toBe('/api/v1/customers/me/cart/items')
  expect(JSON.parse(String(cartRequest?.init?.body))).toEqual({ productId: 42, quantity: 3 })
  expect(new Headers(cartRequest?.init?.headers).get('Authorization')).toBe(
    'Bearer test-access-token',
  )
})

const customerLogin = {
  accessToken: 'test-access-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  account: { id: 10, email: 'shopper@example.com', role: 'CUSTOMER' as const },
}

it('protects customer routes, returns to the requested destination, and signs out', async () => {
  window.history.replaceState({}, '', '/cart?source=footer')
  const requests: { url: URL; init?: RequestInit }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input))
      requests.push({ url, init })
      if (url.pathname.endsWith('/auth/login')) return jsonResponse(customerLogin)
      if (url.pathname.endsWith('/customers/me/cart'))
        return jsonResponse({ id: 1, items: [], subtotal: 0, currency: 'PKR' })
      return jsonResponse({ message: 'Unavailable' }, 503)
    }),
  )
  render(<App />)

  expect(await screen.findByRole('heading', { name: 'Good to see you.' })).toBeVisible()
  expect(window.location.pathname).toBe('/sign-in')
  expect(window.location.search).toBe('')
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'shopper@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('heading', { name: 'Your bag' })).toBeVisible()
  expect(window.location.search).toBe('?source=footer')
  expect(requests.some(({ url }) => url.pathname.endsWith('/customers/me/cart'))).toBe(true)
  const cartRequest = requests.find(({ url }) => url.pathname.endsWith('/customers/me/cart'))
  expect(new Headers(cartRequest?.init?.headers).get('Authorization')).toBe(
    'Bearer test-access-token',
  )

  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(await screen.findByRole('heading', { name: 'Good to see you.' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible()
  expect(hasAccessToken()).toBe(false)
})

it('clears an expired bearer session after an unauthorized customer request', async () => {
  window.history.replaceState({}, '', '/sign-in')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/auth/login')) return jsonResponse(customerLogin)
      if (url.pathname.endsWith('/customers/me/addresses'))
        return jsonResponse({ message: 'Unauthorized' }, 401)
      return jsonResponse({ message: 'Unavailable' }, 503)
    }),
  )
  render(<App />)
  fireEvent.change(await screen.findByLabelText('Email address'), {
    target: { value: 'shopper@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() => expect(hasAccessToken()).toBe(false))
  await waitFor(() =>
    expect(within(screen.getByRole('banner')).getByRole('link', { name: /Sign in/ })).toBeVisible(),
  )
})

it('validates registration locally and reports duplicate account safely', async () => {
  window.history.replaceState({}, '', '/register')
  const authRequests: URL[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/registrations')) {
        authRequests.push(url)
        return jsonResponse({ message: 'Account identifier is already registered.' }, 409)
      }
      return jsonResponse({ message: 'Unavailable' }, 503)
    }),
  )
  render(<App />)
  fireEvent.change(await screen.findByLabelText('Email address'), {
    target: { value: 'shopper@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(await screen.findByText('Use at least 12 characters.')).toBeVisible()
  expect(authRequests).toHaveLength(0)

  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'a-long-enough-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'An account with this email address already exists.',
  )
  expect(authRequests).toHaveLength(1)
})

it('shows rejected login feedback and supports password visibility toggle', async () => {
  window.history.replaceState({}, '', '/sign-in')
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => jsonResponse({ message: 'Invalid email or password.' }, 401)),
  )
  render(<App />)
  const password = await screen.findByLabelText('Password')
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'shopper@example.com' },
  })
  fireEvent.change(password, { target: { value: 'incorrect-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
  expect(screen.getByLabelText('Password')).toHaveValue('incorrect-password')
})

it('creates an account through the documented registration request and routes to sign-in', async () => {
  window.history.replaceState({}, '', '/register')
  let request: { url: URL; init?: RequestInit } | undefined
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/registrations')) {
        request = { url, init }
        return jsonResponse(
          {
            id: 20,
            email: 'shopper@example.com',
            createdAt: '2026-10-14T12:00:00Z',
          },
          201,
        )
      }
      return jsonResponse({ message: 'Unavailable' }, 503)
    }),
  )
  render(<App />)
  fireEvent.change(await screen.findByLabelText('Email address'), {
    target: { value: ' Shopper@example.com ' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'a-long-enough-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Your account is ready. Sign in to continue.',
  )
  expect(request?.url.pathname).toBe('/api/v1/registrations')
  expect(JSON.parse(String(request?.init?.body))).toEqual({
    email: 'Shopper@example.com',
    password: 'a-long-enough-password',
  })
  expect(hasAccessToken()).toBe(false)
})

it('disables repeated sign-in submissions while the request is pending', async () => {
  window.history.replaceState({}, '', '/sign-in')
  let resolveLogin: ((response: Response) => void) | undefined
  const pending = new Promise<Response>((resolve) => {
    resolveLogin = resolve
  })
  let loginCalls = 0
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      if (new URL(String(input)).pathname.endsWith('/auth/login')) {
        loginCalls += 1
        return pending
      }
      return Promise.resolve(jsonResponse({ message: 'Unavailable' }, 503))
    }),
  )
  render(<App />)
  fireEvent.change(await screen.findByLabelText('Email address'), {
    target: { value: 'shopper@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } })
  const submit = screen.getByRole('button', { name: 'Sign in' })
  fireEvent.click(submit)
  expect(await screen.findByRole('button', { name: 'One moment…' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'One moment…' }))
  expect(loginCalls).toBe(1)
  resolveLogin?.(jsonResponse(customerLogin))
  expect(await screen.findByRole('heading', { name: 'Hello, shopper.' })).toBeVisible()
})
