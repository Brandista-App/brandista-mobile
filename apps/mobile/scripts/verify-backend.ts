import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createClient, ApiError } from '../src/lib/client'
import { createApi } from '../src/lib/api'
import { createSessionStore, sessionFromLogin } from '../src/lib/session'
async function main() {
  const base = process.env.MOBILE_TEST_API_BASE_URL || 'http://127.0.0.1:8082/api/v1'
  const url = new URL(base)
  assert(
    ['127.0.0.1', 'localhost'].includes(url.hostname),
    'This mutation test is restricted to the local demo backend.',
  )
  const checks: string[] = []
  const pass = (name: string) => {
    checks.push(name)
    console.log(`PASS ${name}`)
  }
  let token: string | null = null
  const api = createApi(
    createClient(
      base,
      () => token,
      () => {
        token = null
      },
    ),
  )
  const stamp = Date.now()
  const email = `android-${stamp}@example.invalid`
  const password = `Native-${randomBytes(20).toString('hex')}`
  const registration = await api.register(email, password)
  assert(registration.id > 0)
  pass('Real customer registration')
  const login = await api.login(email, password)
  assert.equal(login.account.role, 'CUSTOMER')
  token = login.accessToken
  pass('Real customer login')
  const data = new Map<string, string>()
  const storage = {
    getItemAsync: async (k: string) => data.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => {
      data.set(k, v)
    },
    deleteItemAsync: async (k: string) => {
      data.delete(k)
    },
  }
  const sessions = createSessionStore(storage)
  await sessions.save(sessionFromLogin(login))
  token = null
  token = (await sessions.restore())!.accessToken
  assert((await api.cart()).id > 0)
  pass(
    'Session adapter restores token accepted by backend (host-memory adapter; not device Keystore)',
  )
  const products = await api.products({ size: 100 })
  assert(products.content.length > 0)
  assert((await api.brands()).length > 0)
  assert((await api.categories()).content.length > 0)
  pass('Real product, brand and category discovery')
  const selected = products.content.filter(
    (p) => p.slug.startsWith('demo-m01-') && (p.stockQuantity ?? 0) >= 3,
  )
  const first = selected[0],
    second = selected.find((p) => p.brandId !== first?.brandId)
  assert(first && second, 'Need two in-stock fictional demo brands.')
  assert.equal((await api.product(first.slug)).id, first.id)
  pass('Real product details')
  await api.add(first.id, 1)
  await api.add(second.id, 1)
  let cart = await api.cart()
  assert.equal(cart.items.length, 2)
  assert.equal(new Set(cart.items.map((i) => i.brandName)).size, 2)
  pass('Products from two brands coexist in a server cart')
  const line = cart.items.find((i) => i.productId === first.id)!
  await api.quantity(line.itemId, 2)
  cart = await api.cart()
  assert.equal(cart.items.find((i) => i.productId === first.id)!.quantity, 2)
  assert.equal(Math.round(cart.subtotal * 100), Math.round((2 * first.price + second.price) * 100))
  pass('Quantity changes and server-authoritative subtotal')
  token = null
  await assert.rejects(() => api.cart(), (e:unknown) => e instanceof ApiError && e.status === 401)
  token = (await api.login(email,password)).accessToken
  cart = await api.cart()
  assert.equal(cart.items.length,2)
  assert.equal(cart.items.find(i=>i.productId===first.id)!.quantity,2)
  pass('Server multi-brand cart survives sign-out and re-login')
  if(process.argv.includes('--cart-only')) {
    await api.clear()
    assert.equal((await api.cart()).items.length,0)
    pass('Synthetic cart cleared after verification')
    mkdirSync('../../docs/mobile',{recursive:true})
    writeFileSync('../../docs/mobile/ANDROID-CART-EVIDENCE.json',JSON.stringify({date:new Date().toISOString(),base,checks,customerId:registration.id,limits:['Host API verification, not a device run','Synthetic customer retained; no order placed or inventory decremented in cart-only mode']},null,2)+'\n')
    return
  }
  const otherLine = cart.items.find((i) => i.productId === second.id)!
  await api.remove(otherLine.itemId)
  assert.equal((await api.cart()).items.length, 1)
  await api.add(second.id, 1)
  pass('Remove and re-add cart item')
  const address = {
    recipientName: 'Android Synthetic Test',
    phoneNumber: '+92 300 1234567',
    addressLine1: 'Fictional Android QA House',
    city: 'Lahore',
    province: 'Punjab',
    deliveryInstructions: 'Synthetic local verification only',
  }
  const a = await api.saveAddress(address)
  const b = await api.saveAddress({ ...address, city: 'Karachi', province: 'Sindh' })
  await api.saveAddress({ ...address, addressLine1: 'Fictional Android QA Updated' }, a.id)
  await api.defaultAddress(b.id)
  assert((await api.addresses()).find((x) => x.id === b.id)!.isDefault)
  pass('Address create, edit, list and default')
  const config = await api.config()
  assert(config.codEnabled, 'Local backend must explicitly enable COD.')
  const review = await api.review(b.id)
  assert.equal(review.currency, 'PKR')
  assert.equal(review.paymentMethod, 'COD')
  assert.equal(review.items.length, 2)
  assert.equal(Math.round(review.total * 100), Math.round((2 * first.price + second.price) * 100))
  const request = { addressId: b.id, quoteToken: review.quoteToken }
  const key = randomUUID()
  const order = await api.place(request, key)
  const replay = await api.place(request, key)
  assert.equal(order.id, replay.id)
  assert.equal(order.status, 'PLACED')
  assert.equal(order.paymentStatus, 'UNPAID')
  assert.equal((await api.cart()).items.length, 0)
  pass('COD review, placement, idempotent replay, unpaid status and cart clearing')
  assert((await api.orders()).content.some((o) => o.id === order.id))
  assert.equal((await api.order(String(order.id))).total, review.total)
  pass('Real order history and details')
  await api.deleteAddress(a.id)
  await api.deleteAddress(b.id)
  assert.equal((await api.order(String(order.id))).deliveryAddress.city, 'Karachi')
  pass('Address deletion preserves placed delivery snapshot')
  await sessions.clear()
  token = null
  await assert.rejects(
    () => api.cart(),
    (e: unknown) => e instanceof ApiError && e.status === 401,
  )
  token = (await api.login(email, password)).accessToken
  assert((await api.orders()).content.some((o) => o.id === order.id))
  pass('Logout denies protected calls; login restores customer order history')
  await api.add(first.id, 1)
  await api.clear()
  assert.equal((await api.cart()).items.length, 0)
  pass('Explicit empty cart')
  const evidence = {
    date: new Date().toISOString(),
    base,
    checks,
    customerId: registration.id,
    orderId: order.id,
    total: order.total,
    brands: order.items.map((i) => i.brandName),
    limits: [
      'Host-executed native API client; no emulator or physical device',
      'SecureStore device encryption not exercised by host-memory adapter',
      'Synthetic customer and unpaid COD order retained; demo stock decremented once per ordered quantity. No real payment.',
    ],
  }
  mkdirSync('../../docs/mobile', { recursive: true })
  writeFileSync(
    '../../docs/mobile/ANDROID-API-EVIDENCE.json',
    JSON.stringify(evidence, null, 2) + '\n',
  )
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : 'Verification failed')
  process.exitCode = 1
})
