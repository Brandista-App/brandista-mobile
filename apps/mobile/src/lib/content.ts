export interface HomepageContent {
  banners: {
    id: string
    title: string
    description: string
    imageUrl: string
    destination: string
    placement: 'HERO' | 'PROMOTION' | 'COLLECTION'
  }[]
  sections: { key: 'HERO' | 'COLLECTIONS' | 'BRANDS' | 'PRODUCTS'; enabled: boolean }[]
  brandIds: number[]
  collectionIds: number[]
}
export function contentDestination(
  value: string,
): '/brands' | '/catalogue' | `/catalogue?${string}` | null {
  if (value === '/brands') return '/brands'
  if (value === '/products') return '/catalogue'
  if (/^\/products\?(brandId|categoryId)=[1-9][0-9]*$/.test(value))
    return `/catalogue?${value.split('?')[1]}`
  return null
}
