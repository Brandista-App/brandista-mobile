/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from './auth-context'
import { AddressBook, Checkout, OrderDetails, Orders } from './checkout'
const address = { id: 1, recipientName: 'Demo Customer', phoneNumber: '+92 300 1234567', addressLine1: 'Demo House 1', city: 'Lahore', province: 'Punjab', isDefault: true, createdAt: '2026-10-15T12:00:00', updatedAt: '2026-10-15T12:00:00' }
const cart = { id: 1, currency: 'PKR', subtotal: 2499.95, items: [{ itemId: 1, productId: 1, productName: 'Demo Shirt', brandName: 'Demo Brand', unitPrice: 2499.95, quantity: 1, lineSubtotal: 2499.95, available: true }] }
const review = { quoteToken: 'a'.repeat(64), deliveryAddress: address, items: [{ productId: 1, productSlug: 'demo-shirt', productName: 'Demo Shirt', brandId: 1, brandName: 'Demo Brand', quantity: 1, unitPrice: 2499.95, lineSubtotal: 2499.95 }], subtotal: 2499.95, deliveryCharge: 0, tax: 0, discount: 0, total: 2499.95, currency: 'PKR' as const, paymentMethod: 'COD' as const }
const order = { ...review, id: 12, status: 'PLACED', paymentStatus: 'UNPAID', createdAt: '2026-10-15T12:00:00' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
function mount(element: React.ReactNode, path = '/checkout') {
  return render(<AuthContext.Provider value={{ account: { id: 99, email: 'demo@example.test', role: 'CUSTOMER' }, signIn: vi.fn(), signOut: vi.fn() }}><MemoryRouter initialEntries={[path]}><Routes><Route path="/checkout" element={element} /><Route path="/orders/:id" element={<OrderDetails />} /><Route path="/addresses" element={element} /><Route path="/orders" element={element} /></Routes></MemoryRouter></AuthContext.Provider>)
}
beforeEach(() => { sessionStorage.clear() })
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('adds, edits, selects a default and deletes addresses using the real API wrappers', async () => {
  let saved = [address]
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname
    if (path.endsWith('/addresses') && init?.method === 'POST') { const value = JSON.parse(String(init.body)); saved = [...saved, { ...address, ...value, id: 2, isDefault: false }]; return json(saved[1], 201) }
    if (path.endsWith('/addresses/2/default')) { saved = saved.map((value) => ({ ...value, isDefault: value.id === 2 })); return json(saved[1]) }
    if (path.endsWith('/addresses/2') && init?.method === 'PUT') { saved = saved.map((value) => value.id === 2 ? { ...value, ...JSON.parse(String(init.body)) } : value); return json(saved[1]) }
    if (path.endsWith('/addresses/2') && init?.method === 'DELETE') { saved = [address]; return new Response(null, { status: 204 }) }
    if (path.endsWith('/addresses')) return json(saved)
    return json({ message: 'Unexpected request' }, 404)
  }))
  mount(<AddressBook />, '/addresses')
  expect(await screen.findByText('Demo Customer')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Add address' }))
  for (const [label, value] of [['Recipient name', 'Second recipient'], ['Phone number', '+92 300 7654321'], ['Address line 1', 'Demo House 2'], ['City', 'Karachi'], ['Province / region', 'Sindh']]) fireEvent.change(screen.getByLabelText(label!), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Save address' }))
  const second = (await screen.findByText('Second recipient')).closest('article')!
  fireEvent.click(within(second).getByRole('button', { name: 'Make default' }))
  expect(await screen.findByText('Default address updated.')).toBeVisible()
  fireEvent.click(within(second).getByRole('button', { name: 'Edit' }))
  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Hyderabad' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save address' }))
  expect(await screen.findByText(/Hyderabad/)).toBeVisible()
  fireEvent.click(within(screen.getByText('Second recipient').closest('article')!).getByRole('button', { name: 'Delete' }))
  expect(await screen.findByText('Address deleted.')).toBeVisible()
  expect(screen.queryByText('Second recipient')).not.toBeInTheDocument()
})

it('reuses a persisted idempotency key after a lost response and reload without a second order', async () => {
  const attempts: { key: string | null; body: unknown }[] = []
  let committed = false
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname
    if (path.endsWith('/addresses')) return json([address])
    if (path.endsWith('/cart')) return json(committed ? { ...cart, items: [], subtotal: 0 } : cart)
    if (path.endsWith('/checkout/config')) return json({ codEnabled: true })
    if (path.endsWith('/checkout/preview')) return json(review)
    if (path.endsWith('/orders') && init?.method === 'POST') {
      attempts.push({ key: new Headers(init.headers).get('Idempotency-Key'), body: JSON.parse(String(init.body)) })
      if (!committed) { committed = true; throw new TypeError('Lost response after server commit') }
      return json(order)
    }
    if (path.endsWith('/orders/12')) return json(order)
    return json({}, 404)
  }))
  mount(<Checkout />)
  fireEvent.click(await screen.findByRole('button', { name: 'Review order' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Place COD order' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('We could not reach Brandista')
  expect(attempts).toHaveLength(1)
  cleanup()
  mount(<Checkout />)
  fireEvent.click(await screen.findByRole('button', { name: 'Retry submitted order' }))
  expect(await screen.findByRole('heading', { name: 'Order confirmed' })).toBeVisible()
  expect(await screen.findByText('UNPAID')).toBeVisible()
  expect(attempts).toHaveLength(2)
  expect(attempts[1]).toEqual(attempts[0])
  expect(attempts[0]?.body).toEqual({ addressId: 1, quoteToken: review.quoteToken })
  expect(sessionStorage.getItem('brandista:checkout:99')).toBeNull()
})

it('requires another review if the server rejects stale prices or insufficient stock', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname
    if (path.endsWith('/addresses')) return json([address])
    if (path.endsWith('/cart')) return json(cart)
    if (path.endsWith('/checkout/config')) return json({ codEnabled: true })
    if (path.endsWith('/checkout/preview')) return json(review)
    if (path.endsWith('/orders') && init?.method === 'POST') return json({ message: 'Not enough stock. Update your cart.' }, 409)
    return json({}, 404)
  }))
  mount(<Checkout />)
  fireEvent.click(await screen.findByRole('button', { name: 'Review order' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Place COD order' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Not enough stock')
  expect(screen.queryByRole('button', { name: 'Place COD order' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Review order' })).toBeEnabled()
  expect(sessionStorage.getItem('brandista:checkout:99')).toBeNull()
})

it('does not render another customer order when the backend returns not found', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ message: 'Order not found.' }, 404)))
  mount(<OrderDetails />, '/orders/999')
  expect(await screen.findByRole('alert')).toHaveTextContent('Order not found.')
  expect(screen.queryByText('Demo Customer')).not.toBeInTheDocument()
})

it('loads customer order history and follows the details link', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => new URL(String(input)).pathname.endsWith('/orders/12') ? json(order) : json({ content: [order], page: 0, size: 10, totalElements: 1, totalPages: 1 })))
  mount(<Orders />, '/orders')
  fireEvent.click(await screen.findByRole('link', { name: 'View order details' }))
  expect(await screen.findByRole('heading', { name: 'Order details' })).toBeVisible()
  expect(await screen.findByText('Demo Customer')).toBeVisible()
})
