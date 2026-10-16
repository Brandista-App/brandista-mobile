import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import Cart from '../src/app/(tabs)/cart'
import { api, queryClient } from '../src/lib/runtime'
jest.mock('../src/state/auth', () => ({ useAuth: () => ({ session: { account: { id: 7 } } }) }))
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))
jest.mock('../src/lib/runtime', () => ({
  queryClient: new (require('@tanstack/react-query').QueryClient)({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  }),
  api: { cart: jest.fn(), quantity: jest.fn(), clear: jest.fn(), remove: jest.fn() },
}))
afterEach(() => queryClient.clear())
test('native cart displays server totals and sends item identity for quantity changes', async () => {
  const cart = {
    id: 3,
    currency: 'PKR' as const,
    subtotal: 9876.54,
    items: [
      {
        itemId: 22,
        productId: 99,
        productName: 'Synthetic shirt',
        brandName: 'Demo brand',
        unitPrice: 1234,
        quantity: 1,
        lineSubtotal: 1234,
        available: true,
      },
    ],
  }
  jest.mocked(api.cart).mockResolvedValue(cart)
  jest.mocked(api.quantity).mockResolvedValue(cart)
  await render(
    <QueryClientProvider client={queryClient}>
      <Cart />
    </QueryClientProvider>,
  )
  await screen.findByText('Synthetic shirt')
  expect(screen.getByText(/Subtotal.*9,876.54/)).toBeTruthy()
  await fireEvent.press(screen.getByRole('button', { name: 'Increase' }))
  await waitFor(() => expect(api.quantity).toHaveBeenCalledWith(22, 2))
})
