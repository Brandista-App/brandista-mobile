/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './app'
import { setAccessToken } from './api/client'

afterEach(() => {
  cleanup()
  setAccessToken(null)
  vi.unstubAllGlobals()
})
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
it('redirects anonymous admin visitors to the accessible shared admin login', async () => {
  window.history.replaceState({}, '', '/admin')
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'Administration sign in' })).toBeVisible()
  expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
})
it('rejects a customer account at the admin login', async () => {
  window.history.replaceState({}, '', '/admin/login')
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        response({
          accessToken: 'customer',
          account: { id: 2, email: 'buyer@example.com', role: 'CUSTOMER' },
        }),
      ),
  )
  render(<App />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Use the customer sign-in page')
})
it('loads a brand administrator catalogue without platform account controls', async () => {
  window.history.replaceState({}, '', '/admin/login')
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith('/auth/login'))
      return response({
        accessToken: 'brand',
        account: { id: 3, email: 'brand@example.com', role: 'BRAND_ADMIN' },
      })
    if (url.endsWith('/admin/brands'))
      return response([{ id: 7, name: 'Assigned Brand', slug: 'assigned', status: 'ACTIVE' }])
    return response({ content: [], totalPages: 0 })
  })
  vi.stubGlobal('fetch', fetch)
  render(<App />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'brand@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('heading', { name: 'Marketplace administration' })).toBeVisible()
  expect(await screen.findByText('Assigned Brand · ACTIVE')).toBeVisible()
  expect(screen.queryByText('Create administrator')).not.toBeInTheDocument()
  expect(fetch.mock.calls.some(([url]) => url.includes('/admin/accounts'))).toBe(false)
})
