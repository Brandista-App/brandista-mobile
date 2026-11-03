import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from 'expo-router'
import Home from '../src/app/(tabs)/index'
import { api } from '../src/lib/runtime'
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))
jest.mock('../src/lib/runtime', () => ({
  api: { homepage: jest.fn(), products: jest.fn(), brands: jest.fn(), categories: jest.fn() },
}))
let client: QueryClient
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  jest.clearAllMocks()
  ;(api.products as jest.Mock).mockResolvedValue({ content: [] })
  ;(api.brands as jest.Mock).mockResolvedValue([])
  ;(api.categories as jest.Mock).mockResolvedValue({ content: [], totalPages: 1 })
})
afterEach(async () => {
  await cleanup()
  client.clear()
})
const mount = () =>
  render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>,
  )
test('renders published banners and maps a collection link while respecting disabled sections', async () => {
  ;(api.homepage as jest.Mock).mockResolvedValue({
    banners: [
      {
        id: '1',
        title: 'Autumn edit',
        description: 'New discoveries',
        imageUrl: 'https://images.example.test/edit.png',
        destination: '/products?categoryId=8',
        placement: 'HERO',
      },
    ],
    sections: [
      { key: 'HERO', enabled: true },
      { key: 'BRANDS', enabled: false },
    ],
    brandIds: [],
    collectionIds: [],
  })
  await mount()
  await screen.findByText('Autumn edit')
  expect(screen.queryByText('Featured brands')).toBeNull()
  await fireEvent.press(screen.getByText('Explore'))
  expect(router.push).toHaveBeenCalledWith('/catalogue?categoryId=8')
})
test('retains a usable catalogue homepage when the new content API fails', async () => {
  ;(api.homepage as jest.Mock).mockRejectedValue(new Error('unavailable'))
  await mount()
  await waitFor(() => expect(client.getQueryState(['homepage-content'])?.status).toBe('error'))
  await screen.findByText('Discover something that feels like you.')
  expect(screen.getByText('Explore the catalogue')).toBeTruthy()
})
