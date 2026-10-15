import { Text, View } from 'react-native'
import { router } from 'expo-router'
import type { Product } from '../lib/types'
import { pkr } from '../lib/validation'
import { Button, ProductImage, styles } from './components'
export function ProductCard({ product }: { product: Product }) {
  return (
    <View style={styles.card}>
      <ProductImage label={product.name} />
      <Text style={styles.muted}>{product.brandName}</Text>
      <Text style={styles.heading}>{product.name}</Text>
      <Text style={styles.text}>{pkr(product.price)}</Text>
      <Button
        title={`View ${product.name}`}
        onPress={() =>
          router.push({ pathname: '/products/[slug]', params: { slug: product.slug } })
        }
      />
    </View>
  )
}
