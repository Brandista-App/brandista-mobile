export const brands = [
  { name: 'Mehr Atelier', note: 'Quiet elegance, everyday', color: '#E9DFCF' },
  { name: 'Gul Studio', note: 'A softer kind of statement', color: '#EBD7D2' },
  { name: 'Saanjh Objects', note: 'Thoughtful finishing touches', color: '#DCE3D7' },
]
export const products = [
  {
    id: 'ivory',
    name: 'Ivory embroidered lawn',
    brand: 'Mehr Atelier',
    category: 'Unstitched',
    price: 6490,
    sizes: ['3 piece'],
    description:
      'Airy lawn with delicate tonal embroidery and a coordinating dupatta. An understated occasion, beautifully dressed.',
  },
  {
    id: 'rose',
    name: 'Rose garden ensemble',
    brand: 'Gul Studio',
    category: 'Ready to wear',
    price: 8950,
    sizes: ['S', 'M', 'L'],
    description:
      'A relaxed rose-toned silhouette inspired by slow afternoons. Soft fabric, considered details and an effortless finish.',
  },
  {
    id: 'sage',
    name: 'Sage everyday kurta',
    brand: 'Mehr Atelier',
    category: 'Ready to wear',
    price: 4250,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'A versatile everyday kurta in a soft botanical shade. Designed for easy styling from morning to evening.',
  },
  {
    id: 'bag',
    name: 'The weekend carryall',
    brand: 'Saanjh Objects',
    category: 'Accessories',
    price: 5750,
    sizes: ['One size'],
    description:
      'A compact tan carryall with a clean silhouette and room for daily essentials. A finishing touch for your wardrobe.',
  },
  {
    id: 'dupatta',
    name: 'Champagne woven dupatta',
    brand: 'Gul Studio',
    category: 'Accessories',
    price: 2990,
    sizes: ['One size'],
    description:
      'A light, flowing woven dupatta in warm champagne. Pair with a favourite neutral for a refined finish.',
  },
  {
    id: 'festive',
    name: 'Moonlight festive set',
    brand: 'Mehr Atelier',
    category: 'Unstitched',
    price: 12450,
    sizes: ['3 piece'],
    description:
      'A celebratory ivory ensemble with a soft sheen and intricate embroidered details. A timeless festive palette.',
  },
]
export type DemoProduct = (typeof products)[number]
export type DemoLine = { id: string; size: string; quantity: number }
export const categories = ['All', 'Ready to wear', 'Unstitched', 'Accessories']
export function updateCart(
  lines: DemoLine[],
  id: string,
  size: string,
  quantity: number,
): DemoLine[] {
  const product = products.find((p) => p.id === id)
  if (!product || !product.sizes.includes(size) || !Number.isInteger(quantity)) return lines
  const rest = lines.filter((l) => l.id !== id || l.size !== size)
  return quantity > 0 ? [...rest, { id, size, quantity: Math.min(10, quantity) }] : rest
}
export function restoreCart(raw: string | null): DemoLine[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .slice(0, 30)
      .reduce<DemoLine[]>(
        (cart, line) =>
          line && typeof line.id === 'string' && typeof line.size === 'string'
            ? updateCart(cart, line.id, line.size, line.quantity)
            : cart,
        [],
      )
  } catch {
    return []
  }
}
export const cartTotal = (lines: DemoLine[]) =>
  lines.reduce((sum, l) => sum + (products.find((p) => p.id === l.id)?.price || 0) * l.quantity, 0)
