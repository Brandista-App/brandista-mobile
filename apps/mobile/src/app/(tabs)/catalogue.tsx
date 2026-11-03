import { useLocalSearchParams } from 'expo-router'
import { Catalogue } from '../../ui/catalogue'
export default function CatalogueRoute() {
  const params = useLocalSearchParams<{ brandId?: string; categoryId?: string }>()
  const positive = (value: unknown) =>
    typeof value === 'string' && /^[1-9][0-9]*$/.test(value) ? Number(value) : undefined
  return (
    <Catalogue
      key={`${params.brandId}:${params.categoryId}`}
      brandId={positive(params.brandId)}
      initialCategoryId={positive(params.categoryId)}
    />
  )
}
