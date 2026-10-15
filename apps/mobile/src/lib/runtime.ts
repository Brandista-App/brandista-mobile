import * as SecureStore from 'expo-secure-store'
import { QueryClient } from '@tanstack/react-query'
import { apiBase } from './config'
import { createClient } from './client'
import { createApi } from './api'
import { createSessionStore } from './session'
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15000 }, mutations: { retry: false } },
})
let token: string | null = null
let onExpired: (value: string) => void = () => {}
export const setToken = (value: string | null) => {
  token = value
}
export const setExpiredHandler = (value: (token: string) => void) => {
  onExpired = value
}
export const base = apiBase(process.env.EXPO_PUBLIC_API_BASE_URL, __DEV__)
export const api = createApi(
  createClient(
    base,
    () => token,
    (sent) => onExpired(sent),
  ),
)
const namespace = base.replace(/[^a-zA-Z0-9._-]/g, '_')
export const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}
export const deviceStorage = {
  getItemAsync: (k: string) => SecureStore.getItemAsync(`${namespace}.${k}`),
  setItemAsync: (k: string, v: string) =>
    SecureStore.setItemAsync(`${namespace}.${k}`, v, secureOptions),
  deleteItemAsync: (k: string) => SecureStore.deleteItemAsync(`${namespace}.${k}`),
}
export const sessionStore = createSessionStore(deviceStorage)
