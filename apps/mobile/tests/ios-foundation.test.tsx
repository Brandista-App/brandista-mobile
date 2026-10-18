import { fireEvent, render, screen } from '@testing-library/react-native'
import { apiBase, resolveApiConfig } from '../src/lib/config'
import { SetupScreen } from '../src/ui/setup'
import { ConnectionError, EmptyState } from '../src/ui/feedback'
import { ApiError } from '../src/lib/client'

test('iPhone requires explicit HTTPS across development, staging and production', () => {
  for (const environment of ['development', 'staging', 'production']) {
    expect(() => apiBase(undefined, true, false, 'ios', environment)).toThrow()
    for (const host of [
      'localhost',
      '127.0.0.1',
      '10.0.2.2',
      '[::1]',
      '0.0.0.0',
      '[::]',
      'test.localhost',
    ])
      expect(() => apiBase(`https://${host}/api/v1`, true, false, 'ios', environment)).toThrow()
    expect(() =>
      apiBase('http://192.168.1.20:8082/api/v1', true, false, 'ios', environment),
    ).toThrow()
    expect(apiBase('https://api.example.invalid/api/v1', true, false, 'ios', environment)).toBe(
      'https://api.example.invalid/api/v1',
    )
  }
  expect(() => apiBase('https://api.example.invalid/api/v1', true, true, 'ios')).toThrow()
  expect(() => apiBase('https://api.example.invalid/api/v1', true, false, 'ios', 'typo')).toThrow()
})

test('staging and production cannot inherit a development HTTP or internal-LAN fallback', () => {
  for (const environment of ['staging', 'production']) {
    expect(() => apiBase(undefined, true, false, 'android', environment)).toThrow()
    expect(() =>
      apiBase('http://192.168.1.20/api/v1', true, true, 'android', environment),
    ).toThrow()
  }
  expect(apiBase(undefined, true)).toBe('http://10.0.2.2:8082/api/v1')
  expect(apiBase('http://192.168.1.20/api/v1', false, true)).toBe('http://192.168.1.20/api/v1')
})

test('invalid iPhone configuration resolves to a setup state without a fallback endpoint', () => {
  expect(resolveApiConfig(undefined, true, false, 'ios')).toMatchObject({
    base: '',
    error: expect.any(Error),
  })
  for (const url of [
    'https://user:secret@example.invalid/api/v1',
    'https://example.invalid/api/v1?token=secret',
    'https://example.invalid/wrong',
  ])
    expect(resolveApiConfig(url, true, false, 'ios').error).toBeInstanceOf(Error)
})

test('setup welcome offers accessible local navigation before backend configuration', async () => {
  await render(<SetupScreen />)
  expect(screen.getByText('Welcome to Brandista')).toBeTruthy()
  await fireEvent.press(screen.getByRole('button', { name: 'Connection help' }))
  expect(screen.getByText('Connect your iPhone')).toBeTruthy()
  await fireEvent.press(screen.getByRole('button', { name: 'Back to welcome' }))
  expect(screen.getByRole('button', { name: 'Connection help' })).toBeTruthy()
})

test('connection failures remain visible and retryable without fabricated products', async () => {
  const retry = jest.fn()
  await render(
    <ConnectionError
      error={new ApiError(0, 'Could not reach Brandista. Check your connection and retry.')}
      retry={retry}
    />,
  )
  expect(screen.getByText('Connection unavailable')).toBeTruthy()
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalledTimes(1)
})

test('empty catalogue state is explicit', async () => {
  await render(<EmptyState title="No products published yet" message="Check back later." />)
  expect(screen.getByText('No products published yet')).toBeTruthy()
})
