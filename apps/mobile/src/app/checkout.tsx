import { useEffect, useMemo, useRef, useState } from 'react'
import { Text } from 'react-native'
import { router } from 'expo-router'
import * as Crypto from 'expo-crypto'
import { useQuery } from '@tanstack/react-query'
import { api, queryClient, deviceStorage } from '../lib/runtime'
import { useAuth } from '../state/auth'
import { createPendingStore, newPending, uncertain } from '../lib/checkout'
import type { CheckoutReview, PendingOrder } from '../lib/types'
import { Button, ErrorMessage, Gate, Loading, Screen, styles } from '../ui/components'
import { OrderSummary } from '../ui/order'
function Contents() {
  const { session } = useAuth()
  const id = session!.account.id
  const [selected, setSelected] = useState<number>(),
    [review, setReview] = useState<CheckoutReview | null>(null),
    [pending, setPending] = useState<PendingOrder | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null)
  const lock = useRef(false)
  const store = useMemo(() => createPendingStore(deviceStorage, id), [id])
  const addresses = useQuery({ queryKey: ['addresses', id], queryFn: api.addresses })
  const config = useQuery({ queryKey: ['checkout-config', id], queryFn: api.config })
  useEffect(() => {
    let alive = true
    void store
      .load()
      .then((p) => {
        if (alive) {
          setPending(p)
          setReady(true)
        }
      })
      .catch((e) => {
        if (alive) setError(e)
      })
    return () => {
      alive = false
    }
  }, [store])
  const chosen = selected ?? addresses.data?.find((a) => a.isDefault)?.id ?? addresses.data?.[0]?.id
  const recover = async () => {
    setError(null)
    try {
      setPending(await store.load())
      setReady(true)
    } catch (e) {
      setError(e)
    }
  }
  const preview = async () => {
    if (!chosen || lock.current) return
    lock.current = true
    setBusy(true)
    setError(null)
    setReview(null)
    try {
      setReview(await api.review(chosen))
    } catch (e) {
      setError(e)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  const place = async () => {
    if (lock.current || !ready || (!pending && (!review || !chosen))) return
    lock.current = true
    setBusy(true)
    setError(null)
    const attempt =
      pending ??
      newPending({ addressId: chosen!, quoteToken: review!.quoteToken }, Crypto.randomUUID)
    try {
      await store.save(attempt)
      setPending(attempt)
      const order = await api.place(attempt.request, attempt.key)
      await store.clear()
      setPending(null)
      setReview(null)
      queryClient.setQueryData(['order', id, String(order.id)], order)
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      router.replace({ pathname: '/orders/[id]', params: { id: String(order.id), placed: '1' } })
    } catch (e) {
      setError(e)
      if (!uncertain(e)) {
        await store.clear().catch(setError)
        setPending(null)
        setReview(null)
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <Screen title="Review and checkout">
      <ErrorMessage error={error} />
      {!ready && !error ? <Loading /> : null}
      {!ready && error ? (
        <Button title="Retry recovering previous order" onPress={() => void recover()} />
      ) : null}
      {pending ? (
        <>
          <Text style={styles.text}>
            A previous order result is uncertain. Retry the same request safely or check order
            history. Do not create another order until resolved.
          </Text>
          <Button
            title="Retry previous order"
            disabled={busy || !ready}
            onPress={() => void place()}
          />
          <Button title="Check order history" onPress={() => router.push('/orders')} />
        </>
      ) : null}
      <ErrorMessage error={addresses.error} />
      <ErrorMessage error={config.error} />
      {addresses.isError || config.isError ? (
        <Button
          title="Retry loading checkout"
          onPress={() => {
            void addresses.refetch()
            void config.refetch()
          }}
        />
      ) : null}
      {addresses.isPending || config.isPending ? <Loading /> : null}
      {config.data && !config.data.codEnabled ? (
        <Text style={styles.error}>
          Cash on Delivery is disabled by the backend. Order placement is unavailable.
        </Text>
      ) : null}
      <Button
        title="Manage delivery addresses"
        disabled={busy || !!pending}
        onPress={() => router.push('/addresses')}
      />
      {addresses.data?.map((a) => (
        <Button
          key={a.id}
          title={`${a.id === chosen ? '✓ ' : ''}${a.recipientName} · ${a.addressLine1}, ${a.city}${a.isDefault ? ' · Default' : ''}`}
          disabled={busy || !!pending}
          onPress={() => {
            setSelected(a.id)
            setReview(null)
          }}
        />
      ))}
      {addresses.data?.length === 0 ? (
        <Text style={styles.text}>Add an address before reviewing your order.</Text>
      ) : null}
      <Button
        title="Review current prices and stock"
        disabled={!ready || busy || !!pending || !chosen || !config.data?.codEnabled}
        onPress={() => void preview()}
      />
      {review && !pending ? (
        <>
          <OrderSummary order={review} />
          <Text style={styles.muted}>
            Cash on Delivery is the only supported payment method. Placing an order does not mark it
            paid.
          </Text>
          <Button
            title="Place COD order"
            disabled={busy || !ready || !config.data?.codEnabled}
            onPress={() => void place()}
          />
        </>
      ) : null}
      {busy ? <Loading /> : null}
    </Screen>
  )
}
export default function Checkout() {
  return (
    <Gate>
      <Contents />
    </Gate>
  )
}
