import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import * as SecureStore from 'expo-secure-store'
import ShowcaseScreen from '../src/showcase/Screen'
import { ShowcaseProvider } from '../src/showcase/state'
import { cartTotal, products, restoreCart, updateCart } from '../src/showcase/catalogue'
import * as runtime from '../src/lib/runtime'
let mockParams: Record<string, string> = {}
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => {},
  router: { push: jest.fn(), replace: jest.fn(), setParams: jest.fn(), canGoBack: () => false },
}))
jest.mock('../src/lib/runtime', () => ({ base: '', configurationError: new Error('unconfigured') }))
beforeEach(() => {
  jest.restoreAllMocks()
  mockParams = {}
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null)
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue()
  global.fetch = jest.fn()
})
test('unreachable configured service keeps showcase available without simulated live success', async () => {
  mockParams = { view: 'live' }
  jest.replaceProperty(runtime, 'base', 'https://test.example/api/v1')
  jest.replaceProperty(runtime, 'configurationError', null)
  jest.mocked(global.fetch).mockRejectedValue(new Error('offline'))
  await render(<ShowcaseProvider><ShowcaseScreen /></ShowcaseProvider>)
  await fireEvent.press(screen.getByRole('button', { name: 'Connect to live shopping' }))
  await waitFor(() => expect(screen.getByText(/shopping service is unavailable/)).toBeTruthy())
  expect(screen.getByRole('button', { name: 'Continue offline showcase' })).toBeTruthy()
  expect(screen.queryByText('SIMULATED ORDER CONFIRMATION')).toBeNull()
  expect(global.fetch).toHaveBeenCalledTimes(1)
})
test('bundled catalogue has fictional brands, PKR values and selectable options', () => {
  expect(new Set(products.map((p) => p.brand)).size).toBe(3)
  expect(products.every((p) => p.price > 0 && p.sizes.length && p.description)).toBe(true)
})
test('local cart enforces quantity limits, validates restored data and removes lines', () => {
  const cart = updateCart([], 'rose', 'M', 2)
  expect(cartTotal(cart)).toBe(17900)
  expect(restoreCart(JSON.stringify(cart))).toEqual(cart)
  expect(updateCart(cart, 'rose', 'M', 100)[0].quantity).toBe(10)
  expect(updateCart(cart, 'rose', 'M', 0)).toEqual([])
  expect(restoreCart('[{"id":"unknown","size":"M","quantity":2}]')).toEqual([])
  expect(restoreCart('broken')).toEqual([])
})
test('first launch renders offline without any network request or login', async () => {
  await render(
    <ShowcaseProvider>
      <ShowcaseScreen />
    </ShowcaseProvider>,
  )
  expect(screen.getByText('OFFLINE SHOWCASE · DEMO MODE')).toBeTruthy()
  expect(screen.getByText('Made for\nyour kind\nof beautiful.')).toBeTruthy()
  expect(screen.queryByText('Connection unavailable')).toBeNull()
  expect(screen.getAllByRole('tab')).toHaveLength(5)
  expect(global.fetch).not.toHaveBeenCalled()
})
test('product selection adds only to separate local showcase storage', async () => {
  mockParams = { view: 'product', id: 'rose' }
  await render(
    <ShowcaseProvider>
      <ShowcaseScreen />
    </ShowcaseProvider>,
  )
  await fireEvent.press(screen.getByRole('button', { name: 'M' }))
  await fireEvent.press(screen.getByRole('button', { name: 'Add to demo bag' }))
  await waitFor(() =>
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'brandista.showcase.cart.v1',
      JSON.stringify([{ id: 'rose', size: 'M', quantity: 1 }]),
    ),
  )
  expect(global.fetch).not.toHaveBeenCalled()
})
test('simulated checkout clears only the demo cart and never posts an order', async () => {
  mockParams = { view: 'checkout' }
  jest
    .mocked(SecureStore.getItemAsync)
    .mockResolvedValue('[{"id":"ivory","size":"3 piece","quantity":1}]')
  await render(
    <ShowcaseProvider>
      <ShowcaseScreen />
    </ShowcaseProvider>,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Review simulated order' })).toBeEnabled(),
  )
  await fireEvent.press(screen.getByRole('button', { name: 'Review simulated order' }))
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm simulated order — no purchase' }),
  )
  expect(global.fetch).not.toHaveBeenCalled()
  await waitFor(() =>
    expect(SecureStore.setItemAsync).toHaveBeenLastCalledWith('brandista.showcase.cart.v1', '[]'),
  )
})
test('unconfigured live shopping stays explicit and never fabricates a successful order', async () => {
  mockParams = { view: 'live' }
  await render(
    <ShowcaseProvider>
      <ShowcaseScreen />
    </ShowcaseProvider>,
  )
  await fireEvent.press(screen.getByRole('button', { name: 'Connect to live shopping' }))
  expect(screen.getByText(/awaiting an approved backend deployment/)).toBeTruthy()
  expect(global.fetch).not.toHaveBeenCalled()
})
