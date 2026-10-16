import { Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/runtime'
import { useAuth } from '../../state/auth'
import { Button, ErrorMessage, Gate, Loading, Screen, styles } from '../../ui/components'
import { OrderSummary } from '../../ui/order'
function Contents() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>()
  const { session } = useAuth()
  const q = useQuery({ queryKey: ['order', session!.account.id, id], queryFn: () => api.order(id) })
  return (
    <Screen
      title={q.data ? `Order #${q.data.id}` : 'Order details'}
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      {q.isPending ? <Loading /> : null}
      <ErrorMessage error={q.error} />
      {q.isError ? <Button title="Retry" onPress={() => void q.refetch()} /> : null}
      {q.data ? (
        <>
          {placed === '1' ? (
            <Text accessibilityLiveRegion="polite" style={styles.heading}>
              Your order is placed.
            </Text>
          ) : null}
          <Text style={styles.text}>
            {q.data.status} · {q.data.paymentStatus}
          </Text>
          <Text style={styles.muted}>{new Date(`${q.data.createdAt}Z`).toLocaleString()}</Text>
          <OrderSummary order={q.data} />
        </>
      ) : null}
    </Screen>
  )
}
export default function Order() {
  return (
    <Gate>
      <Contents />
    </Gate>
  )
}
