import type { Address, Page } from './types'
export type AddressInput = Pick<Address, 'recipientName' | 'phoneNumber' | 'addressLine1' | 'addressLine2' | 'city' | 'province' | 'postalCode'> & { deliveryInstructions?: string }
export type Delivery = Omit<AddressInput, 'deliveryInstructions'> & { deliveryInstructions?: string | null }
export type OrderLine = { productId: number; productSlug: string; productName: string; brandId: number; brandName: string; quantity: number; unitPrice: number; lineSubtotal: number }
export type CheckoutReview = { quoteToken: string; deliveryAddress: Delivery; items: OrderLine[]; subtotal: number; deliveryCharge: number; tax: number; discount: number; total: number; currency: 'PKR'; paymentMethod: 'COD' }
export type CustomerOrder = Omit<CheckoutReview, 'quoteToken'> & { id: number; status: 'PLACED'; paymentStatus: 'UNPAID'; createdAt: string }
export type OrderPage = Page<CustomerOrder>
export type OrderRequest = { addressId: number; quoteToken: string }
export type PendingOrder = { key: string; request: OrderRequest }
