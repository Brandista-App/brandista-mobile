import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type PropsWithChildren,
} from 'react'
import * as SecureStore from 'expo-secure-store'
import { restoreCart, updateCart, type DemoLine } from './catalogue'
const Context = createContext<{
  demo: boolean
  setDemo: (value: boolean) => void
  cart: DemoLine[]
  change: (id: string, size: string, quantity: number) => void
  clear: () => void
  storageNotice: string
}>(null!)
const key = 'brandista.showcase.cart.v1'
export function ShowcaseProvider({ children }: PropsWithChildren) {
  const [demo, setDemo] = useState(true)
  const [cart, setCart] = useState<DemoLine[]>([])
  const [ready, setReady] = useState(false)
  const [storageNotice, setStorageNotice] = useState('')
  const touched = useRef(false)
  const writes = useRef(Promise.resolve())
  useEffect(() => {
    let alive = true
    void SecureStore.getItemAsync(key)
      .then((raw) => {
        if (alive && !touched.current) setCart(restoreCart(raw))
      })
      .catch(() => {
        if (alive)
          setStorageNotice(
            'Your demo cart is available for this visit. Device storage is unavailable.',
          )
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => {
    if (!ready) return
    writes.current = writes.current
      .then(() => SecureStore.setItemAsync(key, JSON.stringify(cart)))
      .catch(() => setStorageNotice('Demo cart changes could not be saved on this device.'))
  }, [cart, ready])
  return (
    <Context.Provider
      value={{
        demo,
        setDemo,
        cart,
        storageNotice,
        change: (id, size, quantity) => {
          touched.current = true
          setCart((current) => updateCart(current, id, size, quantity))
        },
        clear: () => {
          touched.current = true
          setCart([])
        },
      }}
    >
      {children}
    </Context.Provider>
  )
}
export const useShowcase = () => useContext(Context)
