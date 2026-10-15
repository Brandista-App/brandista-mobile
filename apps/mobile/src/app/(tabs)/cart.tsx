import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, queryClient } from '../../lib/runtime'
import { useAuth } from '../../state/auth'
import { pkr } from '../../lib/validation'
import { Button, ErrorMessage, Gate, Loading, Screen, styles } from '../../ui/components'
function Contents() {
  const { session } = useAuth()
  const q = useQuery({ queryKey: ['cart', session!.account.id], queryFn: api.cart })
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
  return (
    <Screen title="Your basket" refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      {q.isPending ? <Loading /> : null}
      <ErrorMessage error={q.error} />
      {q.isError ? <Button title="Retry" onPress={() => void q.refetch()} /> : null}
      <ErrorMessage error={mutation.error} />
      {q.data?.items.map((item) => (
        <View key={item.itemId} style={styles.card}>
          <Text style={styles.muted}>{item.brandName}</Text>
          <Text style={styles.heading}>{item.productName}</Text>
          <Text style={styles.text}>
            {pkr(item.unitPrice)} × {item.quantity} = {pkr(item.lineSubtotal)}
          </Text>
          {!item.available ? (
            <Text style={styles.error}>Unavailable. Remove before checkout.</Text>
          ) : null}
          <View style={styles.row}>
            <Button
              title="Decrease"
              disabled={mutation.isPending || item.quantity <= 1}
              onPress={() => mutation.mutate(() => api.quantity(item.itemId, item.quantity - 1))}
            />
            <Button
              title="Increase"
              disabled={mutation.isPending || item.quantity >= 99 || !item.available}
              onPress={() => mutation.mutate(() => api.quantity(item.itemId, item.quantity + 1))}
            />
            <Button
              title="Remove"
              disabled={mutation.isPending}
              onPress={() => mutation.mutate(() => api.remove(item.itemId))}
            />
          </View>
        </View>
      ))}
      {q.data?.items.length ? (
        <>
          <Text style={styles.heading}>Subtotal {pkr(q.data.subtotal)}</Text>
          <Text style={styles.muted}>
            Server cart prices are provisional. Checkout verifies stock and calculates final totals.
          </Text>
          <Button
            title="Review checkout"
            disabled={mutation.isPending || q.data.items.some((i) => !i.available)}
            onPress={() => router.push('/checkout')}
          />
          <Button
            title="Empty cart"
            disabled={mutation.isPending}
            onPress={() => mutation.mutate(api.clear)}
          />
        </>
      ) : q.data ? (
        <>
          <Text style={styles.text}>Your basket is empty.</Text>
          <Button title="Explore products" onPress={() => router.push('/catalogue')} />
        </>
      ) : null}
    </Screen>
  )
}
export default function Cart() {
  return (
    <Gate>
      <Contents />
    </Gate>
  )
}
