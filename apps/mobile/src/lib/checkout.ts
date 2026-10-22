import { ApiError } from './client'
import type { PendingOrder, OrderRequest } from './types'
import type { Storage } from './session'
export function createPendingStore(storage: Storage, customerId: number) {
  const key = `brandista.pending.${customerId}`
  return {
    async load(): Promise<PendingOrder | null> {
      const raw = await storage.getItemAsync(key)
      if (!raw) return null
      const pending = JSON.parse(raw) as PendingOrder
      if (
        !/^[a-f0-9-]{36}$/i.test(pending.key) ||
        !Number.isInteger(pending.request?.addressId) ||
        pending.request.addressId < 1 ||
        !/^[a-f0-9]{64}$/.test(pending.request.quoteToken)
      )
        throw new Error(
          'Saved order retry is invalid. Check order history before starting another order.',
        )
      return pending
    },
    save: (pending: PendingOrder) => storage.setItemAsync(key, JSON.stringify(pending)),
    clear: () => storage.deleteItemAsync(key),
  }
}
export function newPending(request: OrderRequest, uuid: () => string): PendingOrder {
  return { key: uuid(), request }
}
export function uncertain(error: unknown) {
  return (
    !(error instanceof ApiError) ||
    error.status === 0 ||
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500 ||
    error.status === 401
  )
}
