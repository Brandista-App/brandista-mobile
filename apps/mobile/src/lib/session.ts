import type { Account, LoginResponse } from './types'
export type Session = { accessToken: string; account: Account; expiresAt: number }
export type Storage = {
  getItemAsync(key: string): Promise<string | null>
  setItemAsync(key: string, value: string): Promise<void>
  deleteItemAsync(key: string): Promise<void>
}
export function sessionFromLogin(login: LoginResponse, now = Date.now()): Session {
  if (
    login.account.role !== 'CUSTOMER' ||
    login.tokenType !== 'Bearer' ||
    !login.accessToken ||
    login.expiresIn <= 0
  )
    throw new Error('Please sign in with a customer account.')
  return {
    accessToken: login.accessToken,
    account: login.account,
    expiresAt: now + login.expiresIn * 1000,
  }
}
export function usableSession(value: unknown, now = Date.now()): value is Session {
  const s = value as Session | null
  return (
    !!s &&
    typeof s.accessToken === 'string' &&
    !!s.accessToken &&
    Number.isFinite(s.expiresAt) &&
    s.expiresAt > now &&
    s.account?.role === 'CUSTOMER' &&
    Number.isInteger(s.account.id) &&
    typeof s.account.email === 'string'
  )
}
export function createSessionStore(storage: Storage) {
  const key = 'brandista.session.v1'
  let writes: Promise<void> = Promise.resolve()
  const write = (operation: () => Promise<void>) => {
    writes = writes.catch(() => {}).then(operation)
    return writes
  }
  return {
    async restore(): Promise<Session | null> {
      await writes
      const raw = await storage.getItemAsync(key)
      if (!raw) return null
      try {
        const value: unknown = JSON.parse(raw)
        if (usableSession(value)) return value
      } catch {
        /* discard corrupt record */
      }
      await storage.deleteItemAsync(key)
      return null
    },
    save: (value: Session) => write(() => storage.setItemAsync(key, JSON.stringify(value))),
    clear: () => write(() => storage.deleteItemAsync(key)),
  }
}
