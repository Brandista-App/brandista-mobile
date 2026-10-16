import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import SignIn from '../src/app/sign-in'
import { useAuth } from '../src/state/auth'
import { api } from '../src/lib/runtime'
import { router } from 'expo-router'
jest.mock('../src/state/auth', () => ({ useAuth: jest.fn() }))
jest.mock('../src/lib/runtime', () => ({ api: { register: jest.fn() } }))
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))
beforeEach(() => jest.clearAllMocks())
test('invalid native form stays on screen without authenticating', async () => {
  const signIn = jest.fn()
  jest
    .mocked(useAuth)
    .mockReturnValue({
      signIn,
      notice: '',
      session: null,
      ready: true,
      signOut: jest.fn(),
      retryRestore: jest.fn(),
    })
  await render(<SignIn />)
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }))
  expect(screen.getByText('Enter a valid email.')).toBeTruthy()
  expect(screen.getByText('Enter your password.')).toBeTruthy()
  expect(signIn).not.toHaveBeenCalled()
})
test('successful login calls real session interface and replaces account navigation', async () => {
  const signIn = jest.fn().mockResolvedValue(undefined)
  jest
    .mocked(useAuth)
    .mockReturnValue({
      signIn,
      notice: '',
      session: null,
      ready: true,
      signOut: jest.fn(),
      retryRestore: jest.fn(),
    })
  await render(<SignIn />)
  await fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.invalid')
  await fireEvent.changeText(screen.getByLabelText('Password'), 'test-password-only')
  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }))
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false)
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/account'))
  expect(signIn).toHaveBeenCalledWith('test@example.invalid', 'test-password-only')
})
test('registration uses backend adapter and returns to login without fake authentication', async () => {
  const signIn = jest.fn()
  jest
    .mocked(useAuth)
    .mockReturnValue({
      signIn,
      notice: '',
      session: null,
      ready: true,
      signOut: jest.fn(),
      retryRestore: jest.fn(),
    })
  jest.mocked(api.register).mockResolvedValue({ id: 1, email: 'test@example.invalid' })
  await render(<SignIn />)
  await fireEvent.press(screen.getByRole('button', { name: 'Create a customer account' }))
  await fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.invalid')
  await fireEvent.changeText(screen.getByLabelText('Password'), 'test-password-only')
  await fireEvent.press(screen.getByRole('button', { name: 'Register' }))
  await screen.findByText('Account created. Sign in with your password.')
  expect(api.register).toHaveBeenCalledWith('test@example.invalid', 'test-password-only')
  expect(signIn).not.toHaveBeenCalled()
})
