import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Text, View } from 'react-native'
import { api } from '../../lib/runtime'
import { Button, Screen, Loading, ErrorMessage, styles } from '../../ui/components'
export default function Brands() {
  const q = useQuery({ queryKey: ['brands'], queryFn: api.brands })
  return (
    <Screen
      title="Independent brands"
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      {q.isPending ? <Loading /> : null}
      <ErrorMessage error={q.error} />
      {q.isError ? <Button title="Retry" onPress={() => void q.refetch()} /> : null}
      {q.data?.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.heading}>{b.name}</Text>
          <Text style={styles.text}>{b.description}</Text>
          <Button
            title={`Shop ${b.name}`}
            onPress={() => router.push({ pathname: '/brands/[id]', params: { id: String(b.id) } })}
          />
        </View>
      ))}
      {q.data?.length === 0 ? <Text style={styles.text}>No active brands yet.</Text> : null}
    </Screen>
  )
}
