export type Page<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
export type Brand = {
  id: number
  name: string
  slug: string
  description?: string | null
  logoReference?: string | null
}
export type BrandApplicationSubmission = {
  brandName: string
  contactName: string
  contactEmail: string
  website?: string
  message?: string
}
export type BrandApplicationReceipt = {
  id: number
  status: 'SUBMITTED'
  createdAt: string
}
export type Category = { id: number; name: string; slug: string; description?: string | null }
export type Product = {
  id: number
  name: string
  slug: string
  description?: string | null
  brandId: number
  brandName: string
  categoryId: number
  categoryName: string
  price: number
  currency: 'PKR'
  availability: 'AVAILABLE' | 'UNAVAILABLE'
}
export type Account = { id: number; email: string; role: 'CUSTOMER' | 'ADMIN' }
export type LoginResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  account: Account
}
export type Address = {
  id: number
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  province?: string | null
  postalCode?: string | null
  createdAt: string
  updatedAt: string
}
export type CartItem = {
  itemId: number
  productId: number
  productName: string
  brandName: string
  unitPrice: number
  quantity: number
  lineSubtotal: number
  available: boolean
}
export type Cart = { id: number; items: CartItem[]; subtotal: number; currency: 'PKR' }
