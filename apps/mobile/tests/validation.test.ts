import { addressErrors, authErrors, pkr } from '../src/lib/validation'
import { apiBase } from '../src/lib/config'
test('registration follows backend code point and UTF-8 byte policy', () => {
  expect(authErrors('a@example.com', 'short', true)).toHaveProperty('password')
  expect(authErrors('a@example.com', 'a'.repeat(12), true)).toEqual({})
  expect(authErrors('a@example.com', '🙂'.repeat(19), true)).toHaveProperty('password')
  expect(authErrors('bad', 'password', false)).toHaveProperty('email')
})
test('address validation catches missing required fields, invalid phone, and backend limits', () => {
  const input = {
    recipientName: 'Test',
    phoneNumber: '+92 300 1234567',
    addressLine1: 'Fictional house',
    city: 'Lahore',
    province: 'Punjab',
  }
  expect(addressErrors(input)).toEqual({})
  expect(addressErrors({ ...input, phoneNumber: '123' })).toHaveProperty('phoneNumber')
  expect(addressErrors({ ...input, deliveryInstructions: 'x'.repeat(501) })).toHaveProperty(
    'deliveryInstructions',
  )
})
test('all displayed amounts use PKR formatting', () => {
  expect(pkr(1250.5)).toContain('1,250.50')
  expect(pkr(1250.5)).toMatch(/PKR|Rs/)
})
test('release configuration requires HTTPS and rejects local defaults and credentials', () => {
  expect(apiBase(undefined, true)).toBe('http://10.0.2.2:8082/api/v1')
  expect(() => apiBase(undefined, false)).toThrow()
  expect(() => apiBase('http://10.0.2.2:8082/api/v1', false)).toThrow()
  expect(() => apiBase('https://u:p@example.com/api/v1', false)).toThrow()
  expect(apiBase('https://api.example.com/api/v1', false)).toBe('https://api.example.com/api/v1')
})

test('internal LAN release accepts only explicit private hosts while production stays HTTPS', () => {
  expect(apiBase('http://192.168.100.66:8083/api/v1', false, true)).toBe(
    'http://192.168.100.66:8083/api/v1',
  )
  for (const host of ['example.com', '8.8.8.8', '127.0.0.1', '10.0.2.2', '172.32.0.1'])
    expect(() => apiBase(`http://${host}:8083/api/v1`, false, true)).toThrow()
  expect(() => apiBase('http://192.168.100.66:8083/api/v1', false)).toThrow()
  expect(() => apiBase('http://u:p@192.168.100.66:8083/api/v1', false, true)).toThrow()
})
