import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { Gate, Button, ProductImage } from '../src/ui/components'
import { useAuth } from '../src/state/auth'
import { router } from 'expo-router'
jest.mock('../src/state/auth', () => ({ useAuth: jest.fn() }))
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))
test('protected navigation shows sign-in and does not render private content', async () => {
  jest.mocked(useAuth).mockReturnValue({ session: null, notice: '' } as ReturnType<typeof useAuth>)
  await render(
    <Gate>
      <Text>Private order</Text>
    </Gate>,
  )
  expect(screen.queryByText('Private order')).toBeNull()
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }))
  expect(router.push).toHaveBeenCalledWith('/sign-in')
})
test('signed-in customers can render protected content', async () => {
  jest
    .mocked(useAuth)
    .mockReturnValue({ session: { account: { id: 1 } } } as ReturnType<typeof useAuth>)
  await render(
    <Gate>
      <Text>Private order</Text>
    </Gate>,
  )
  expect(screen.getByText('Private order')).toBeTruthy()
})
test('disabled mutation button prevents duplicate actions and photo absence is explicit', async () => {
  const press = jest.fn()
  await render(
    <>
      <Button title="Place order" disabled onPress={press} />
      <ProductImage label="Shirt" />
    </>,
  )
  await fireEvent.press(screen.getByRole('button', { name: 'Place order' }))
  expect(press).not.toHaveBeenCalled()
  expect(screen.getByText('Product photo unavailable')).toBeTruthy()
})
