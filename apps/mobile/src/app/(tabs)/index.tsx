import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Text } from 'react-native'
import { api } from '../../lib/runtime'
import { Button, Screen, Heading, Loading, styles } from '../../ui/components'
import { ProductCard } from '../../ui/products'
import { BrandMark } from '../../ui/brand'
import { ConnectionError, EmptyState } from '../../ui/feedback'
export default function Home() {
  const products = useQuery({ queryKey: ['featured'], queryFn: () => api.products({ size: 6 }) })
  return (
    <Screen
      title="Brandista"
      refreshing={products.isRefetching}
      onRefresh={() => void products.refetch()}
    >
      <BrandMark />
      <Text style={styles.muted}>MANY BRANDS. ONE DESTINATION.</Text>
      <Heading>Discover something that feels like you.</Heading>
      <Text style={styles.text}>Explore Pakistani brands and build a basket across labels.</Text>
      <Button title="Explore the catalogue" onPress={() => router.push('/catalogue')} />
      {products.isPending ? <Loading /> : null}
      <ConnectionError error={products.error} retry={() => void products.refetch()} />
      {products.data?.content.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      {products.data && !products.data.content.length ? (
        <EmptyState
          title="No products published yet"
          message="Check back as brands publish their collections."
        />
      ) : null}
    </Screen>
  )
}
