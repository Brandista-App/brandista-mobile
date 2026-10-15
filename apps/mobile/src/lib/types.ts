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
  stockQuantity?: number
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
  deliveryInstructions?: string | null
  isDefault?: boolean
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
export type AddressInput = Pick<
  Address,
  | 'recipientName'
  | 'phoneNumber'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'province'
  | 'postalCode'
> & { deliveryInstructions?: string }
export type Delivery = Omit<AddressInput, 'deliveryInstructions'> & {
  deliveryInstructions?: string | null
}
export type OrderLine = {
  productId: number
  productSlug: string
  productName: string
  brandId: number
  brandName: string
  quantity: number
  unitPrice: number
  lineSubtotal: number
}
export type CheckoutReview = {
  quoteToken: string
  deliveryAddress: Delivery
  items: OrderLine[]
  subtotal: number
  deliveryCharge: number
  tax: number
  discount: number
  total: number
  currency: 'PKR'
  paymentMethod: 'COD'
}
export type CustomerOrder = Omit<CheckoutReview, 'quoteToken'> & {
  id: number
  status: 'PLACED'
  paymentStatus: 'UNPAID'
  createdAt: string
}
export type OrderPage = Page<CustomerOrder>
export type OrderRequest = { addressId: number; quoteToken: string }
export type PendingOrder = { key: string; request: OrderRequest }
