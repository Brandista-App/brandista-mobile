import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import { Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as Crypto from 'expo-crypto'
import Brands from '../src/app/(tabs)/brands'
import Cart from '../src/app/(tabs)/cart'
import ProductDetail from '../src/app/products/[slug]'
import Addresses from '../src/app/addresses'
import Checkout from '../src/app/checkout'
import Orders from '../src/app/orders'
import Order from '../src/app/orders/[id]'
import { Catalogue } from '../src/ui/catalogue'
import { api, deviceStorage, queryClient } from '../src/lib/runtime'
import { useAuth } from '../src/state/auth'
import { ApiError } from '../src/lib/client'
import type { Address, CheckoutReview, CustomerOrder, Product } from '../src/lib/types'

jest.mock('../src/state/auth', () => ({ useAuth: jest.fn() }))
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}))
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }))
jest.mock('../src/lib/runtime', () => ({
  queryClient: new (require('@tanstack/react-query').QueryClient)({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  }),
  deviceStorage: { getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() },
  api: Object.fromEntries(
    [
      'brands',
      'products',
      'categories',
      'product',
      'add',
      'cart',
      'quantity',
      'remove',
      'clear',
      'addresses',
      'saveAddress',
      'deleteAddress',
      'defaultAddress',
      'config',
      'review',
      'place',
      'orders',
      'order',
    ].map((name) => [name, jest.fn()]),
  ),
}))

// Synthetic fixtures only: never used against a real backend or as device evidence.
const product: Product = {
  id: 99,
  slug: 'synthetic-shirt',
  name: 'Synthetic shirt',
  brandId: 3,
  brandName: 'Synthetic brand',
  categoryId: 7,
  categoryName: 'Clothing',
  price: 1234.5,
  currency: 'PKR',
  stockQuantity: 3,
  availability: 'AVAILABLE',
}
const address: Address = {
  id: 8,
  recipientName: 'Synthetic customer',
  phoneNumber: '+923001234567',
  addressLine1: 'Synthetic address',
  city: 'Lahore',
  province: 'Punjab',
  isDefault: true,
  createdAt: '2026-10-22T00:00:00',
  updatedAt: '2026-10-22T00:00:00',
}
const cart = {
  id: 1,
  currency: 'PKR' as const,
  subtotal: 1234.5,
  items: [
    {
      itemId: 22,
      productId: product.id,
      productName: product.name,
      brandName: product.brandName,
      quantity: 1,
      unitPrice: product.price,
      lineSubtotal: product.price,
      available: true,
    },
  ],
}
const review: CheckoutReview = {
  quoteToken: 'a'.repeat(64),
  deliveryAddress: address,
  items: [
    {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brandId: product.brandId,
      brandName: product.brandName,
      quantity: 1,
      unitPrice: product.price,
      lineSubtotal: product.price,
    },
  ],
  subtotal: product.price,
  deliveryCharge: 0,
  tax: 0,
  discount: 0,
  total: product.price,
  currency: 'PKR',
  paymentMethod: 'COD',
}
const order: CustomerOrder = {
  ...review,
  id: 12,
  status: 'PLACED',
  paymentStatus: 'UNPAID',
  createdAt: '2026-10-22T00:00:00',
}
const key = '12345678-1234-4234-8234-123456789abc'
const stored = new Map<string, string>()
const page = <T,>(content: T[]) => ({
  content,
  page: 0,
  size: 12,
  totalElements: content.length,
  totalPages: 1,
})
const mount = (element: React.ReactNode) =>
  render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>)
beforeEach(() => {
  jest.resetAllMocks()
  queryClient.clear()
  stored.clear()
  jest
    .mocked(useAuth)
    .mockReturnValue({ session: { account: { id: 7 } }, notice: '' } as ReturnType<typeof useAuth>)
  jest.mocked(useLocalSearchParams).mockReturnValue({ slug: product.slug, id: '12', placed: '1' })
  jest.mocked(Crypto.randomUUID).mockReturnValue(key)
  jest.mocked(deviceStorage.getItemAsync).mockImplementation(async (k) => stored.get(k) ?? null)
  jest.mocked(deviceStorage.setItemAsync).mockImplementation(async (k, v) => {
    stored.set(k, v)
  })
  jest.mocked(deviceStorage.deleteItemAsync).mockImplementation(async (k) => {
    stored.delete(k)
  })
  jest
    .mocked(api.brands)
    .mockResolvedValue([{ id: 3, name: 'Synthetic brand', slug: 'synthetic-brand' }])
  jest
    .mocked(api.categories)
    .mockResolvedValue(page([{ id: 7, name: 'Clothing', slug: 'clothing' }]))
  jest.mocked(api.products).mockResolvedValue(page([product]))
  jest.mocked(api.product).mockResolvedValue(product)
  jest.mocked(api.cart).mockResolvedValue(cart)
  jest.mocked(api.quantity).mockResolvedValue(cart)
  jest.mocked(api.remove).mockResolvedValue(undefined)
  jest.mocked(api.clear).mockResolvedValue({ ...cart, items: [], subtotal: 0 })
  jest.mocked(api.addresses).mockResolvedValue([address])
  jest.mocked(api.saveAddress).mockResolvedValue(address)
  jest.mocked(api.defaultAddress).mockResolvedValue(address)
  jest.mocked(api.deleteAddress).mockResolvedValue(undefined)
  jest.mocked(api.config).mockResolvedValue({ codEnabled: true, currency: 'PKR' })
  jest.mocked(api.review).mockResolvedValue(review)
  jest.mocked(api.place).mockResolvedValue(order)
  jest.mocked(api.orders).mockResolvedValue(page([order]))
  jest.mocked(api.order).mockResolvedValue(order)
})
afterEach(() => {
  queryClient.clear()
  jest.restoreAllMocks()
})

test('brand discovery opens a brand route and empty brands are explicit', async () => {
  const view = await mount(<Brands />)
  await fireEvent.press(await screen.findByRole('button', { name: 'Shop Synthetic brand' }))
  expect(router.push).toHaveBeenCalledWith({ pathname: '/brands/[id]', params: { id: '3' } })
  await view.unmount()
  queryClient.clear()
  jest.mocked(api.brands).mockResolvedValue([])
  await mount(<Brands />)
  expect(await screen.findByText('No active brands yet.')).toBeTruthy()
})
test('catalogue applies search/category/sort and renders product navigation', async () => {
  await mount(<Catalogue />)
  await screen.findByRole('button', { name: 'Clothing' })
  await fireEvent.changeText(screen.getByLabelText('Search products'), ' shirt ')
  await fireEvent.press(screen.getByRole('button', { name: 'Search' }))
  await fireEvent.press(screen.getByRole('button', { name: 'Clothing' }))
  await fireEvent.press(screen.getByRole('button', { name: 'Price ↑' }))
  await waitFor(() =>
    expect(api.products).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: 'shirt', categoryId: 7, sort: 'price_asc', page: 0 }),
    ),
  )
  expect(await screen.findByText(product.name)).toBeTruthy()
})
test('catalogue network failure retries without fabricating results', async () => {
  jest.mocked(api.products).mockRejectedValueOnce(new ApiError(0, 'Connection unavailable'))
  await mount(<Catalogue />)
  expect(await screen.findByText('Connection unavailable')).toBeTruthy()
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText(product.name)).toBeTruthy()
})
test('empty catalogue and pending loading states are explicit', async () => {
  jest.mocked(api.products).mockResolvedValue(page([]))
  await mount(<Catalogue />)
  expect(
    await screen.findByText('No matching products. Try another search or category.'),
  ).toBeTruthy()
})
test('pending catalogue request exposes a loading indicator', async () => {
  jest.mocked(api.products).mockImplementation(() => new Promise(() => {}))
  await mount(<Catalogue />)
  expect(screen.getByLabelText('Loading')).toBeTruthy()
  expect(screen.queryByText(product.name)).toBeNull()
})
test('saved address default selection uses the owned address identifier', async () => {
  jest.mocked(api.addresses).mockResolvedValue([{ ...address, isDefault: false }])
  await mount(<Addresses />)
  await fireEvent.press(await screen.findByRole('button', { name: 'Make default' }))
  await waitFor(() => expect(api.defaultAddress).toHaveBeenCalledWith(address.id))
})
test('product details show PKR, stock and submit only the selected quantity', async () => {
  await mount(<ProductDetail />)
  await screen.findByText('3 in stock')
  expect(screen.getByText(/1,234.50/)).toBeTruthy()
  expect(screen.getByText('Product photo unavailable')).toBeTruthy()
  await fireEvent.press(screen.getByRole('button', { name: 'Increase quantity' }))
  await fireEvent.press(screen.getByRole('button', { name: 'Add to cart' }))
  await waitFor(() => expect(api.add).toHaveBeenCalledWith(product.id, 2))
})
test('unavailable products cannot be added', async () => {
  jest
    .mocked(api.product)
    .mockResolvedValue({ ...product, availability: 'UNAVAILABLE', stockQuantity: 0 })
  await mount(<ProductDetail />)
  await screen.findByText('0 in stock')
  await fireEvent.press(screen.getByRole('button', { name: 'Add to cart' }))
  expect(api.add).not.toHaveBeenCalled()
})
test('cart removes and clears server items and blocks decrease below one', async () => {
  await mount(<Cart />)
  await screen.findByText(product.name)
  await fireEvent.press(screen.getByRole('button', { name: 'Decrease' }))
  expect(api.quantity).not.toHaveBeenCalled()
  await fireEvent.press(screen.getByRole('button', { name: 'Remove' }))
  await waitFor(() => expect(api.remove).toHaveBeenCalledWith(22))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Empty cart' })).toBeEnabled())
  await fireEvent.press(screen.getByRole('button', { name: 'Empty cart' }))
  await waitFor(() => expect(api.clear).toHaveBeenCalled())
})
test('addresses validate input, edit, default, and confirm deletion', async () => {
  const confirm = jest.spyOn(Alert, 'alert')
  await mount(<Addresses />)
  await screen.findByText(/Synthetic customer/)
  await fireEvent.press(screen.getByRole('button', { name: 'Save address' }))
  expect(api.saveAddress).not.toHaveBeenCalled()
  await fireEvent.press(screen.getByRole('button', { name: 'Edit' }))
  await fireEvent.changeText(screen.getByLabelText('City'), 'Karachi')
  await fireEvent.press(screen.getByRole('button', { name: 'Save address' }))
  await waitFor(() =>
    expect(api.saveAddress).toHaveBeenCalledWith(expect.objectContaining({ city: 'Karachi' }), 8),
  )
  await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled())
  await fireEvent.press(screen.getByRole('button', { name: 'Delete' }))
  expect(api.deleteAddress).not.toHaveBeenCalled()
  const action = confirm.mock.calls[0][2]!.find((button) => button.text === 'Delete')!
  await action.onPress!()
  await waitFor(() => expect(api.deleteAddress).toHaveBeenCalledWith(8))
})
async function prepareCheckout() {
  await mount(<Checkout />)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Review current prices and stock' })).toBeEnabled(),
  )
  await fireEvent.press(screen.getByRole('button', { name: 'Review current prices and stock' }))
  await screen.findByRole('button', { name: 'Place COD order' })
}
test('COD checkout places a server quote and navigates to order confirmation', async () => {
  await prepareCheckout()
  await fireEvent.press(screen.getByRole('button', { name: 'Place COD order' }))
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/orders/[id]',
      params: { id: '12', placed: '1' },
    }),
  )
  expect(api.place).toHaveBeenCalledWith({ addressId: 8, quoteToken: review.quoteToken }, key)
  expect(stored.size).toBe(0)
})
test.each([0, 408, 429, 503])(
  'uncertain HTTP %s retains the exact persisted order key for retry',
  async (status) => {
    jest.mocked(api.place).mockRejectedValueOnce(new ApiError(status, 'Outcome uncertain'))
    await prepareCheckout()
    await fireEvent.press(screen.getByRole('button', { name: 'Place COD order' }))
    await screen.findByText('Outcome uncertain')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Retry previous order' })).toBeEnabled(),
    )
    expect(JSON.parse(stored.get('brandista.pending.7')!).key).toBe(key)
    await fireEvent.press(screen.getByRole('button', { name: 'Retry previous order' }))
    await waitFor(() => expect(api.place).toHaveBeenCalledTimes(2))
    expect(jest.mocked(api.place).mock.calls[1]).toEqual(jest.mocked(api.place).mock.calls[0])
  },
)
test('stock conflicts invalidate review and require a new server preview', async () => {
  jest.mocked(api.place).mockRejectedValue(new ApiError(409, 'Insufficient stock'))
  await prepareCheckout()
  await fireEvent.press(screen.getByRole('button', { name: 'Place COD order' }))
  await screen.findByText('Insufficient stock')
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Place COD order' })).toBeNull())
  expect(stored.size).toBe(0)
})
test('UUID failure is visible and restores checkout controls without sending an order', async () => {
  jest.mocked(Crypto.randomUUID).mockImplementation(() => {
    throw new Error('Random generation unavailable')
  })
  await prepareCheckout()
  await fireEvent.press(screen.getByRole('button', { name: 'Place COD order' }))
  expect(await screen.findByText('Random generation unavailable')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Place COD order' })).toBeEnabled()
  expect(api.place).not.toHaveBeenCalled()
})
test('COD disabled prevents review and placement', async () => {
  jest.mocked(api.config).mockResolvedValue({ codEnabled: false, currency: 'PKR' })
  await mount(<Checkout />)
  await screen.findByText(/Cash on Delivery is disabled/)
  await fireEvent.press(screen.getByRole('button', { name: 'Review current prices and stock' }))
  expect(api.review).not.toHaveBeenCalled()
  expect(api.place).not.toHaveBeenCalled()
})
test('order history opens details and confirmation uses backend totals', async () => {
  const view = await mount(<Orders />)
  await fireEvent.press(await screen.findByRole('button', { name: 'View order 12' }))
  expect(router.push).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: '12' } })
  await view.unmount()
  await mount(<Order />)
  expect(await screen.findByText('Your order is placed.')).toBeTruthy()
  expect(screen.getByText(/Total.*1,234.50/)).toBeTruthy()
})
test('unauthorized order responses show an error without another customer snapshot', async () => {
  jest.mocked(api.order).mockRejectedValue(new ApiError(403, 'Forbidden'))
  await mount(<Order />)
  expect(await screen.findByText('Forbidden')).toBeTruthy()
  expect(screen.queryByText('Your order is placed.')).toBeNull()
  expect(screen.queryByText(/Deliver to/)).toBeNull()
})
