import { useState } from 'react'
import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/runtime'
import { Button, ErrorMessage, Field, Loading, Screen, styles } from './components'
import { ProductCard } from './products'
export function Catalogue({ brandId }: { brandId?: number }) {
  const [draft, setDraft] = useState(''),
    [keyword, setKeyword] = useState(''),
    [categoryId, setCategory] = useState<number | undefined>(),
    [sort, setSort] = useState('default'),
    [page, setPage] = useState(0),
    [categoryPage, setCategoryPage] = useState(0)
  const categories = useQuery({
    queryKey: ['categories', categoryPage],
    queryFn: () => api.categories(categoryPage),
  })
  const brands = useQuery({ queryKey: ['brands'], queryFn: api.brands, enabled: !!brandId })
  const q = useQuery({
    queryKey: ['products', { keyword, categoryId, sort, page, brandId }],
    queryFn: () =>
      api.products({
        keyword,
        sort,
        page,
        size: 12,
        ...(categoryId ? { categoryId } : {}),
        ...(brandId ? { brandId } : {}),
      }),
  })
  return (
    <Screen
      title={brands.data?.find((b) => b.id === brandId)?.name || 'Explore products'}
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      <Field
        label="Search products"
        value={draft}
        onChangeText={setDraft}
        maxLength={100}
        returnKeyType="search"
        onSubmitEditing={() => {
          setKeyword(draft.trim())
          setPage(0)
        }}
      />
      <Button
        title="Search"
        onPress={() => {
          setKeyword(draft.trim())
          setPage(0)
        }}
      />
      <Text style={styles.muted}>Categories</Text>
      <ErrorMessage error={categories.error} />
      {categories.isError ? (
        <Button title="Retry categories" onPress={() => void categories.refetch()} />
      ) : null}
      <View style={styles.row}>
        <Button
          title={!categoryId ? 'All categories ✓' : 'All categories'}
          onPress={() => {
            setCategory(undefined)
            setPage(0)
          }}
        />
        {categories.data?.content.map((c) => (
          <Button
            key={c.id}
            title={`${c.name}${categoryId === c.id ? ' ✓' : ''}`}
            onPress={() => {
              setCategory(c.id)
              setPage(0)
            }}
          />
        ))}
      </View>
      {categories.data && categories.data.totalPages > 1 ? (
        <View style={styles.row}>
          <Button
            title="Previous categories"
            disabled={categoryPage === 0}
            onPress={() => setCategoryPage((p) => p - 1)}
          />
          <Button
            title="More categories"
            disabled={categoryPage + 1 >= categories.data.totalPages}
            onPress={() => setCategoryPage((p) => p + 1)}
          />
        </View>
      ) : null}
      <View style={styles.row}>
        {[
          ['default', 'Recommended'],
          ['price_asc', 'Price ↑'],
          ['price_desc', 'Price ↓'],
        ].map(([value, label]) => (
          <Button
            key={value}
            title={`${label}${sort === value ? ' ✓' : ''}`}
            onPress={() => {
              setSort(value)
              setPage(0)
            }}
          />
        ))}
      </View>
      {q.isPending ? <Loading /> : null}
      <ErrorMessage error={q.error} />
      {q.isError ? <Button title="Retry" onPress={() => void q.refetch()} /> : null}
      {q.data?.content.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      {q.data && !q.data.content.length ? (
        <Text style={styles.text}>No matching products. Try another search or category.</Text>
      ) : null}
      <View style={styles.row}>
        <Button
          title="Previous page"
          disabled={page === 0 || q.isPending}
          onPress={() => setPage((p) => p - 1)}
        />
        <Button
          title="Next page"
          disabled={!q.data || page + 1 >= q.data.totalPages}
          onPress={() => setPage((p) => p + 1)}
        />
      </View>
    </Screen>
  )
}
