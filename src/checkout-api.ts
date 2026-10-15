import { apiRequest, jsonBody } from './api/client'
import type { Address } from './types'
import type { AddressInput, CheckoutReview, CustomerOrder, OrderPage, OrderRequest } from './checkout-types'
const root = '/customers/me'
export const saveAddress = (input: AddressInput, id?: number) => apiRequest<Address>(`${root}/addresses${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: jsonBody(input) })
export const deleteAddress = (id: number) => apiRequest<void>(`${root}/addresses/${id}`, { method: 'DELETE' })
export const defaultAddress = (id: number) => apiRequest<Address>(`${root}/addresses/${id}/default`, { method: 'PUT' })
export const checkoutConfig = () => apiRequest<{ codEnabled: boolean; currency: string }>(`${root}/checkout/config`)
export const reviewCheckout = (addressId: number) => apiRequest<CheckoutReview>(`${root}/checkout/preview`, { method: 'POST', body: jsonBody({ addressId }) })
export const placeOrder = (request: OrderRequest, key: string) => apiRequest<CustomerOrder>(`${root}/orders`, { method: 'POST', headers: { 'Idempotency-Key': key }, body: jsonBody(request) })
export const getOrders = (page = 0) => apiRequest<OrderPage>(`${root}/orders?page=${page}&size=10`)
export const getOrder = (id: string) => apiRequest<CustomerOrder>(`${root}/orders/${encodeURIComponent(id)}`)
