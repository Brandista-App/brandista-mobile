import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { AppState } from 'react-native'
import { focusManager } from '@tanstack/react-query'
import { api, queryClient, sessionStore, setExpiredHandler, setToken } from '../lib/runtime'
import { sessionFromLogin, type Session } from '../lib/session'
const Context = createContext<{
  session: Session | null
  ready: boolean
  notice: string
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  retryRestore: () => void
}>(null!)
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(''),
    [attempt, setAttempt] = useState(0)
  const current = useRef<Session | null>(null)
  const generation = useRef(0)
  const clear = useCallback(async (message = '') => {
    generation.current++
    current.current = null
    setToken(null)
    setSession(null)
    queryClient.clear()
    setNotice(message)
    await sessionStore.clear()
  }, [])
  useEffect(() => {
    let alive = true
    void sessionStore
      .restore()
      .then((s) => {
        if (!alive) return
        current.current = s
        setToken(s?.accessToken ?? null)
        setSession(s)
        setReady(true)
      })
      .catch(() => {
        if (alive) {
          setNotice('Secure storage could not be read. Retry session initialization.')
          setReady(false)
        }
      })
    setExpiredHandler((sent) => {
      if (current.current?.accessToken === sent)
        void clear('Your session expired. Sign in again.').catch(() =>
          setNotice('Session ended. Secure storage could not be cleared.'),
        )
    })
    return () => {
      alive = false
      setExpiredHandler(() => {})
    }
  }, [clear, attempt])
  useEffect(() => {
    const expire = () => {
      if (current.current && current.current.expiresAt <= Date.now())
        void clear('Your session expired. Sign in again.').catch(() =>
          setNotice('Secure storage cleanup failed.'),
        )
    }
    const timer = setInterval(expire, 1000)
    const listener = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active')
      if (state === 'active') expire()
    })
    return () => {
      clearInterval(timer)
      listener.remove()
    }
  }, [clear])
  const signIn = async (email: string, password: string) => {
    const ticket = ++generation.current
    const next = sessionFromLogin(await api.login(email.trim().toLowerCase(), password))
    if (ticket !== generation.current) return
    await sessionStore.save(next)
    if (ticket !== generation.current) return
    queryClient.clear()
    current.current = next
    setToken(next.accessToken)
    setSession(next)
    setNotice('')
  }
  return (
    <Context.Provider
      value={{
        session,
        ready,
        notice,
        signIn,
        signOut: () => clear(),
        retryRestore: () => {
          setNotice('')
          setAttempt((x) => x + 1)
        },
      }}
    >
      {children}
    </Context.Provider>
  )
}
export const useAuth = () => useContext(Context)
