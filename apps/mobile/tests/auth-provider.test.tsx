import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { AppState, Button, Text, type AppStateStatus } from 'react-native'
import { AuthProvider, useAuth } from '../src/state/auth'
import { api, queryClient, sessionStore, setExpiredHandler, setToken } from '../src/lib/runtime'
import type { Session } from '../src/lib/session'

jest.mock('../src/lib/runtime', () => ({
  api: { login: jest.fn() },
  queryClient: { clear: jest.fn() },
  sessionStore: { restore: jest.fn(), save: jest.fn(), clear: jest.fn() },
  setToken: jest.fn(),
  setExpiredHandler: jest.fn(),
}))
const session: Session = {
  accessToken: 'synthetic-token',
  account: { id: 7, email: 'test@example.invalid', role: 'CUSTOMER' },
  expiresAt: Date.now() + 60000,
}
let foreground: (state: AppStateStatus) => void
function Probe() {
  const auth = useAuth()
  return (
    <>
      <Text>{auth.ready ? 'Ready' : 'Restoring'}</Text>
      <Text>{auth.session?.account.email || 'Signed out'}</Text>
      <Text>{auth.notice}</Text>
      <Button title="Logout" onPress={() => void auth.signOut()} />
      <Button title="Retry restore" onPress={auth.retryRestore} />
    </>
  )
}
beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(sessionStore.restore).mockResolvedValue(session)
  jest.mocked(sessionStore.clear).mockResolvedValue(undefined)
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    foreground = listener
    return { remove: jest.fn() }
  })
})
afterEach(() => jest.restoreAllMocks())
test('restoration installs a token and logout clears memory, cache, and persisted session', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
  await screen.findByText(session.account.email)
  expect(setToken).toHaveBeenCalledWith(session.accessToken)
  await fireEvent.press(screen.getByText('Logout'))
  await screen.findByText('Signed out')
  expect(setToken).toHaveBeenLastCalledWith(null)
  expect(queryClient.clear).toHaveBeenCalled()
  expect(sessionStore.clear).toHaveBeenCalled()
})
test('foreground expiration clears the customer before further navigation', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
  await screen.findByText(session.account.email)
  jest.spyOn(Date, 'now').mockReturnValue(session.expiresAt)
  await act(async () => foreground('active'))
  await screen.findByText('Your session expired. Sign in again.')
  expect(screen.getByText('Signed out')).toBeTruthy()
  expect(sessionStore.clear).toHaveBeenCalled()
})
test('a stale 401 does not clear the current token but a matching 401 does', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
  await screen.findByText(session.account.email)
  const expired = jest.mocked(setExpiredHandler).mock.calls.at(-1)![0]
  await act(async () => expired('older-request-token'))
  expect(sessionStore.clear).not.toHaveBeenCalled()
  await act(async () => expired(session.accessToken))
  await screen.findByText('Signed out')
  expect(sessionStore.clear).toHaveBeenCalledTimes(1)
})
test('SecureStore read failure blocks initialization and exposes a working retry', async () => {
  jest.mocked(sessionStore.restore).mockRejectedValueOnce(new Error('locked storage'))
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
  await screen.findByText('Secure storage could not be read. Retry session initialization.')
  expect(screen.getByText('Restoring')).toBeTruthy()
  await fireEvent.press(screen.getByText('Retry restore'))
  await waitFor(() => expect(screen.getByText('Ready')).toBeTruthy())
  expect(screen.getByText(session.account.email)).toBeTruthy()
})
