import { createSessionStore, sessionFromLogin, usableSession } from '../src/lib/session'
import type { LoginResponse } from '../src/lib/types'
const login: LoginResponse = {
  accessToken: 'test-only',
  tokenType: 'Bearer',
  expiresIn: 60,
  account: { id: 7, email: 'test@example.invalid', role: 'CUSTOMER' },
}
function memory() {
  const data = new Map<string, string>()
  return {
    data,
    getItemAsync: async (k: string) => data.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => {
      data.set(k, v)
    },
    deleteItemAsync: async (k: string) => {
      data.delete(k)
    },
  }
}
test('session survives restart through secure storage adapter and logout removes it', async () => {
  const storage = memory()
  const first = createSessionStore(storage)
  const value = sessionFromLogin(login)
  await first.save(value)
  expect(await createSessionStore(storage).restore()).toEqual(value)
  await first.clear()
  expect(await first.restore()).toBeNull()
})
test('expired and corrupt sessions are discarded', async () => {
  const storage = memory()
  const store = createSessionStore(storage)
  await store.save(sessionFromLogin(login, 0))
  expect(await store.restore()).toBeNull()
  storage.data.set('brandista.session.v1', '{broken')
  expect(await store.restore()).toBeNull()
  expect(storage.data.size).toBe(0)
})
test('admin role and malformed stored identities cannot restore as a customer', () => {
  expect(() =>
    sessionFromLogin({ ...login, account: { ...login.account, role: 'ADMIN' } }),
  ).toThrow('customer')
  expect(
    usableSession({
      accessToken: 'test',
      expiresAt: Date.now() + 1000,
      account: { role: 'CUSTOMER', id: '7' },
    }),
  ).toBe(false)
})
test('expiry boundary rejects the session', () => {
  const s = sessionFromLogin(login, 1000)
  expect(usableSession(s, 60999)).toBe(true)
  expect(usableSession(s, 61000)).toBe(false)
})
test('secure storage read failures are surfaced instead of treated as successful restoration', async () => {
  const store = createSessionStore({
    ...memory(),
    getItemAsync: async () => {
      throw Error('locked')
    },
  })
  await expect(store.restore()).rejects.toThrow('locked')
})
