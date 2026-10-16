import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Text } from 'react-native'
import { api } from '../../lib/runtime'
import { Button, Screen, Heading, Loading, ErrorMessage, styles } from '../../ui/components'
import { ProductCard } from '../../ui/products'
export default function Home() {
  const products = useQuery({ queryKey: ['featured'], queryFn: () => api.products({ size: 6 }) })
  return (
    <Screen
      title="Brandista"
      refreshing={products.isRefetching}
      onRefresh={() => void products.refetch()}
    >
      <Text style={styles.muted}>INDEPENDENT LABELS. ONE DESTINATION.</Text>
      <Heading>Discover something that feels like you.</Heading>
      <Text style={styles.text}>Explore Pakistani brands and build a basket across labels.</Text>
      <Button title="Explore the catalogue" onPress={() => router.push('/catalogue')} />
      {products.isPending ? <Loading /> : null}
      <ErrorMessage error={products.error} />
      {products.isError ? <Button title="Retry" onPress={() => void products.refetch()} /> : null}
      {products.data?.content.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      {products.data && !products.data.content.length ? (
        <Text style={styles.text}>No products published yet.</Text>
      ) : null}
    </Screen>
  )
}
