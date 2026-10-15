import { useState } from 'react'
import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '../../lib/runtime'
import { useAuth } from '../../state/auth'
import { pkr } from '../../lib/validation'
import { Button, ErrorMessage, Gate, Loading, Screen, styles } from '../../ui/components'
function Contents() {
  const { session } = useAuth()
  const [page, setPage] = useState(0)
  const q = useQuery({
    queryKey: ['orders', session!.account.id, page],
    queryFn: () => api.orders(page),
  })
  return (
    <Screen title="Your orders" refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      {q.isPending ? <Loading /> : null}
      <ErrorMessage error={q.error} />
      {q.isError ? <Button title="Retry" onPress={() => void q.refetch()} /> : null}
      {q.data?.content.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.heading}>
            Order #{o.id} · {pkr(o.total)}
          </Text>
          <Text style={styles.text}>
            {o.status} · {o.paymentMethod} · {o.paymentStatus}
          </Text>
          <Button
            title={`View order ${o.id}`}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: String(o.id) } })}
          />
        </View>
      ))}
      {q.data && !q.data.content.length ? <Text style={styles.text}>No orders yet.</Text> : null}
      <View style={styles.row}>
        <Button
          title="Previous orders"
          disabled={page === 0}
          onPress={() => setPage((p) => p - 1)}
        />
        <Button
          title="More orders"
          disabled={!q.data || page + 1 >= q.data.totalPages}
          onPress={() => setPage((p) => p + 1)}
        />
      </View>
    </Screen>
  )
}
export default function Orders() {
  return (
    <Gate>
      <Contents />
    </Gate>
  )
}
