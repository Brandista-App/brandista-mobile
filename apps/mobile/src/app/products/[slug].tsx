import { useState } from 'react'
import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, queryClient } from '../../lib/runtime'
import { useAuth } from '../../state/auth'
import { pkr } from '../../lib/validation'
import { Button, ErrorMessage, Loading, ProductImage, Screen, styles } from '../../ui/components'
export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { session } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const q = useQuery({ queryKey: ['product', slug], queryFn: () => api.product(slug) })
  const add = useMutation({
    mutationFn: () => api.add(q.data!.id, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
  const p = q.data
  return (
    <Screen
      title={p?.name || 'Product'}
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      {q.isPending ? <Loading /> : null}
      <ErrorMessage error={q.error} />
      {q.isError ? <Button title="Retry" onPress={() => void q.refetch()} /> : null}
      {p ? (
        <>
          <ProductImage label={p.name} />
          <Text style={styles.muted}>
            {p.brandName} · {p.categoryName}
          </Text>
          <Text style={styles.heading}>{pkr(p.price)}</Text>
          <Text style={styles.text}>{p.description || 'No description provided.'}</Text>
          <Text style={styles.muted}>
            {p.stockQuantity === undefined
              ? 'Stock checked at checkout'
              : `${p.stockQuantity} in stock`}
          </Text>
          <View style={styles.row}>
            <Button
              title="Decrease quantity"
              disabled={quantity <= 1}
              onPress={() => setQuantity((v) => v - 1)}
            />
            <Text style={styles.text}>{quantity}</Text>
            <Button
              title="Increase quantity"
              disabled={
                quantity >= 99 || (p.stockQuantity !== undefined && quantity >= p.stockQuantity)
              }
              onPress={() => setQuantity((v) => v + 1)}
            />
          </View>
          <Button
            title={session ? 'Add to cart' : 'Sign in to add to cart'}
            disabled={add.isPending || p.availability !== 'AVAILABLE' || p.stockQuantity === 0}
            onPress={() => (session ? add.mutate() : router.push('/sign-in'))}
          />
          <ErrorMessage error={add.error} />
          {add.isSuccess ? (
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              Added to your cart.
            </Text>
          ) : null}
        </>
      ) : null}
    </Screen>
  )
}
