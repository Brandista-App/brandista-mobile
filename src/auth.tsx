import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { setAccessToken } from './api/client'
import type { Account } from './types'
type AuthValue = {
  account: Account | null
  signIn: (token: string, account: Account) => void
  signOut: () => void
}
const AuthContext = createContext<AuthValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const value = useMemo<AuthValue>(
    () => ({
      account,
      signIn: (token, who) => {
        setAccessToken(token)
        setAccount(who)
      },
      signOut: () => {
        setAccessToken(null)
        setAccount(null)
      },
    }),
    [account],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
