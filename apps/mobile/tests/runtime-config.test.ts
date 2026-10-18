jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))

test('unconfigured iPhone runtime loads without crashing and refuses API transport', async () => {
  const saved = { ...process.env }
  const originalFetch = global.fetch
  const transport = jest.fn()
  global.fetch = transport
  delete process.env.EXPO_PUBLIC_API_BASE_URL
  delete process.env.EXPO_PUBLIC_APP_ENV
  delete process.env.EXPO_PUBLIC_APP_VARIANT
  try {
    let runtime: typeof import('../src/lib/runtime')
    jest.isolateModules(() => {
      runtime = require('../src/lib/runtime')
    })
    expect(runtime!.configurationError).toBeInstanceOf(Error)
    expect(runtime!.base).toBe('')
    await expect(runtime!.api.products()).rejects.toThrow('EXPO_PUBLIC_API_BASE_URL')
    expect(transport).not.toHaveBeenCalled()
  } finally {
    process.env = saved
    global.fetch = originalFetch
  }
})
