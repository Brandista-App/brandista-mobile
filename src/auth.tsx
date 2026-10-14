import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { setAccessToken } from './api/client'
import { AuthContext, type AuthValue } from './auth-context'
import type { Account } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  useEffect(() => {
    const expireSession = () => {
      setAccessToken(null)
      setAccount(null)
    }
    window.addEventListener('brandista:session-expired', expireSession)
    return () => window.removeEventListener('brandista:session-expired', expireSession)
  }, [])
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
