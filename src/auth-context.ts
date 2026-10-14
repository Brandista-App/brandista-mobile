import { createContext, useContext } from 'react'
import type { Account } from './types'

export type AuthValue = {
  account: Account | null
  signIn: (token: string, account: Account) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
