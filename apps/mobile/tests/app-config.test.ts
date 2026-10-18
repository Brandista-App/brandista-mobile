const savedEnvironment = { ...process.env }
afterEach(() => {
  process.env = { ...savedEnvironment }
})

function config() {
  let result: typeof import('../app.config').default
  jest.isolateModules(() => {
    result = require('../app.config').default
  })
  return result!
}
function development() {
  process.env.APP_VARIANT = 'development'
  delete process.env.EXPO_PUBLIC_APP_VARIANT
  delete process.env.IOS_BUILD
  delete process.env.IOS_BUNDLE_IDENTIFIER
  delete process.env.EAS_PROJECT_ID
  delete process.env.EXPO_PUBLIC_API_BASE_URL
}

test('configuration does not invent iOS identity or EAS ownership for the setup screen', () => {
  development()
  expect(config().platforms).toEqual(['android', 'ios'])
  expect(config().ios?.bundleIdentifier).toBeUndefined()
  expect(config().extra?.eas).toBeUndefined()
  expect(config().android?.package).toBe('com.brandista.mobile.dev')
})

test('signed build configuration requires approved identity, project and HTTPS API', () => {
  development()
  process.env.IOS_BUILD = '1'
  expect(config).toThrow('owner-approved')
  process.env.IOS_BUNDLE_IDENTIFIER = 'invalid identifier'
  expect(config).toThrow('reverse-DNS')
  process.env.IOS_BUNDLE_IDENTIFIER = 'invalid.example.brandista.test'
  process.env.EAS_PROJECT_ID = '00000000-0000-4000-8000-000000000000'
  expect(config).toThrow('HTTPS API')
  for (const url of [
    'http://192.168.1.20/api/v1',
    'https://localhost/api/v1',
    'https://user:secret@example.invalid/api/v1',
  ]) {
    process.env.EXPO_PUBLIC_API_BASE_URL = url
    expect(config).toThrow('HTTPS API')
  }
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.invalid/api/v1'
  expect(config().ios?.bundleIdentifier).toBe('invalid.example.brandista.test')
})
