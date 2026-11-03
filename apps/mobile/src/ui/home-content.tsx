import { Image, View, Text } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/runtime'
import { contentDestination, type HomepageContent } from '../lib/content'
import { Button, Heading, styles } from './components'
import { ProductCard } from './products'

export function HomeContent({ content }: { content: HomepageContent }) {
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => api.brands() })
  const categories = useQuery({
    queryKey: ['categories', 'home'],
    queryFn: async () => {
      const first = await api.categories()
      const content = [...first.content]
      for (let page = 1; page < first.totalPages; page++)
        content.push(...(await api.categories(page)).content)
      return { ...first, content }
    },
  })
  const products = useQuery({ queryKey: ['featured'], queryFn: () => api.products({ size: 6 }) })
  const banners = (collection: boolean) =>
    content.banners
      .filter((b) => (b.placement === 'COLLECTION') === collection)
      .map((b) => {
        const destination = contentDestination(b.destination)
        return (
          <View key={b.id} style={{ gap: 8, marginVertical: 12 }}>
            <Image
              source={{ uri: /^https:\/\//.test(b.imageUrl) ? b.imageUrl : undefined }}
              style={{ width: '100%', height: 200, borderRadius: 12 }}
              accessibilityLabel={b.title}
            />
            <Heading>{b.title}</Heading>
            <Text style={styles.text}>{b.description}</Text>
            {destination && <Button title="Explore" onPress={() => router.push(destination)} />}
          </View>
        )
      })
  return (
    <>
      {content.sections
        .filter((s) => s.enabled)
        .map((s) => (
          <View key={s.key} style={{ gap: 12 }}>
            {s.key === 'HERO' && banners(false)}
            {s.key === 'COLLECTIONS' && (
              <>
                <Heading>Featured collections</Heading>
                {content.collectionIds
                  .map((id) => categories.data?.content.find((c) => c.id === id))
                  .map((c) =>
                    c ? (
                      <Button
                        key={c.id}
                        title={c.name}
                        onPress={() => router.push(`/catalogue?categoryId=${c.id}`)}
                      />
                    ) : null,
                  )}
                {banners(true)}
              </>
            )}
            {s.key === 'BRANDS' && (
              <>
                <Heading>Featured brands</Heading>
                {content.brandIds
                  .map((id) => brands.data?.find((b) => b.id === id))
                  .map((b) =>
                    b ? (
                      <Button
                        key={b.id}
                        title={b.name}
                        onPress={() => router.push(`/catalogue?brandId=${b.id}`)}
                      />
                    ) : null,
                  )}
              </>
            )}
            {s.key === 'PRODUCTS' && (
              <>
                <Heading>Discover products</Heading>
                {products.data?.content.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </>
            )}
          </View>
        ))}
    </>
  )
}
