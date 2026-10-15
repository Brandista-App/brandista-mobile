import type { Request } from './client'
import type {
  Address,
  AddressInput,
  Brand,
  Cart,
  Category,
  CheckoutReview,
  CustomerOrder,
  LoginResponse,
  OrderPage,
  OrderRequest,
  Page,
  Product,
} from './types'
export function createApi(request: Request) {
  const send = <T>(
    path: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>,
  ) =>
    request<T>(path, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  return {
    products: (params: Record<string, string | number> = {}) =>
      request<Page<Product>>(
        `/products?${Object.entries(params)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')}`,
      ),
    product: (slug: string) => request<Product>(`/products/${encodeURIComponent(slug)}`),
    brands: () => request<Brand[]>('/brands'),
    categories: (page = 0) => request<Page<Category>>(`/categories?page=${page}&size=50`),
    register: (email: string, password: string) =>
      send<{ id: number; email: string }>('/registrations', 'POST', { email, password }),
    login: (email: string, password: string) =>
      send<LoginResponse>('/auth/login', 'POST', { email, password }),
    cart: () => request<Cart>('/customers/me/cart'),
    add: (productId: number, quantity: number) =>
      send<Cart>('/customers/me/cart/items', 'POST', { productId, quantity }),
    quantity: (id: number, quantity: number) =>
      send<Cart>(`/customers/me/cart/items/${id}`, 'PATCH', { quantity }),
    remove: (id: number) => send<void>(`/customers/me/cart/items/${id}`, 'DELETE'),
    clear: () => send<Cart>('/customers/me/cart/items', 'DELETE'),
    addresses: () => request<Address[]>('/customers/me/addresses'),
    saveAddress: (body: AddressInput, id?: number) =>
      send<Address>(`/customers/me/addresses${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', body),
    deleteAddress: (id: number) => send<void>(`/customers/me/addresses/${id}`, 'DELETE'),
    defaultAddress: (id: number) => send<Address>(`/customers/me/addresses/${id}/default`, 'PUT'),
    config: () =>
      request<{ codEnabled: boolean; currency: string }>('/customers/me/checkout/config'),
    review: (addressId: number) =>
      send<CheckoutReview>('/customers/me/checkout/preview', 'POST', { addressId }),
    place: (body: OrderRequest, key: string) =>
      send<CustomerOrder>('/customers/me/orders', 'POST', body, { 'Idempotency-Key': key }),
    orders: (page = 0) => request<OrderPage>(`/customers/me/orders?page=${page}&size=20`),
    order: (id: string) => request<CustomerOrder>(`/customers/me/orders/${encodeURIComponent(id)}`),
  }
}
