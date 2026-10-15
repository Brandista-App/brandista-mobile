import { createPendingStore, newPending, uncertain } from '../src/lib/checkout'
import { ApiError } from '../src/lib/client'
test('pending request survives restart and stays scoped to the customer', async () => {
  const data = new Map<string, string>()
  const storage = {
    getItemAsync: async (k: string) => data.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => {
      data.set(k, v)
    },
    deleteItemAsync: async (k: string) => {
      data.delete(k)
    },
  }
  const pending = newPending(
    { addressId: 8, quoteToken: 'a'.repeat(64) },
    () => '12345678-1234-4234-8234-123456789abc',
  )
  await createPendingStore(storage, 1).save(pending)
  expect(await createPendingStore(storage, 1).load()).toEqual(pending)
  expect(await createPendingStore(storage, 2).load()).toBeNull()
  await createPendingStore(storage, 1).clear()
  expect(await createPendingStore(storage, 1).load()).toBeNull()
})
test('network/server/expired-session outcomes keep the retry; validation and stock conflicts need review', () => {
  for (const code of [0, 401, 500, 503]) expect(uncertain(new ApiError(code, 'test'))).toBe(true)
  for (const code of [400, 403, 404, 409]) expect(uncertain(new ApiError(code, 'test'))).toBe(false)
})
test('corrupt pending data blocks unsafe new placement', async () => {
  const storage = {
    getItemAsync: async () => JSON.stringify({ key: 'bad', request: { addressId: 1 } }),
    setItemAsync: async () => {},
    deleteItemAsync: async () => {},
  }
  await expect(createPendingStore(storage, 1).load()).rejects.toThrow('Check order history')
})
