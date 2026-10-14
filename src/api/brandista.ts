import { apiRequest, jsonBody } from './client'
import type { Address, Brand, Cart, Category, LoginResponse, Page, Product } from '../types'
export const discoverProducts = (params = new URLSearchParams()) =>
  apiRequest<Page<Product>>(`/products${params.size ? `?${params}` : ''}`)
export const getProduct = (slug: string) =>
  apiRequest<Product>(`/products/${encodeURIComponent(slug)}`)
export const discoverBrands = () => apiRequest<Page<Brand>>('/brands')
export const discoverCategories = () => apiRequest<Page<Category>>('/categories')
export const register = (email: string, password: string) =>
  apiRequest<{ id: number; email: string; createdAt: string }>('/registrations', {
    method: 'POST',
    body: jsonBody({ email, password }),
  })
export const login = (email: string, password: string) =>
  apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: jsonBody({ email, password }) })
export const getCart = () => apiRequest<Cart>('/customers/me/cart')
export const addCartItem = (productId: number, quantity: number) =>
  apiRequest<Cart>('/customers/me/cart/items', {
    method: 'POST',
    body: jsonBody({ productId, quantity }),
  })
export const updateCartItem = (itemId: number, quantity: number) =>
  apiRequest<Cart>(`/customers/me/cart/items/${itemId}`, {
    method: 'PATCH',
    body: jsonBody({ quantity }),
  })
export const removeCartItem = (itemId: number) =>
  apiRequest<void>(`/customers/me/cart/items/${itemId}`, { method: 'DELETE' })
export const getAddresses = () => apiRequest<Address[]>('/customers/me/addresses')
