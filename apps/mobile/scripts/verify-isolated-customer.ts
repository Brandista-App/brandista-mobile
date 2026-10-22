import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createApi } from '../src/lib/api'
import { ApiError, createClient } from '../src/lib/client'
import { createPendingStore, newPending, uncertain } from '../src/lib/checkout'
import { createSessionStore, sessionFromLogin } from '../src/lib/session'

// Explicitly isolated host API acceptance; not a native iOS/Keychain/UI test.
// Provisioning is separate: never point this mutation runner at an existing stack.
async function main() {
  const contextPath = path.resolve(
    process.env.BRANDISTA_TEST002_CONTEXT || '.expo/test-002-context.json',
  )
  const context = JSON.parse(readFileSync(contextPath, 'utf8')) as {
    project: string
    container: string
    database: string
    base: string
    backendSHA: string
  }
  assert(
    /^brandista-test002-[a-f0-9]{10}$/.test(context.project),
    'Expected fresh TEST-002 project',
  )
  assert.equal(context.database, 'brandista_test002')
  const endpoint = new URL(context.base)
  assert(
    endpoint.protocol === 'http:' &&
      endpoint.hostname === '127.0.0.1' &&
      endpoint.pathname === '/api/v1' &&
      !endpoint.username &&
      !endpoint.password &&
      !endpoint.search &&
      !endpoint.hash,
    'Only the isolated loopback API is allowed',
  )
  const project = execFileSync(
    'docker',
    [
      'inspect',
      '--format',
      '{{ index .Config.Labels "com.docker.compose.project" }}',
      context.container,
    ],
    { encoding: 'utf8' },
  ).trim()
  assert.equal(project, context.project, 'Container isolation label mismatch')
  const db = (sql: string) =>
    execFileSync(
      'docker',
      [
        'exec',
        '-i',
        context.container,
        'sh',
        '-c',
        'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u "$MYSQL_USER" "$MYSQL_DATABASE" -N',
      ],
      { input: sql, encoding: 'utf8' },
    ).trim()
  assert.equal(db('SELECT DATABASE();'), context.database)
  assert.equal(
    db('SELECT MAX(CAST(version AS UNSIGNED)) FROM flyway_schema_history WHERE success=1;'),
    '14',
  )
  assert.equal(
    db('SELECT COUNT(*) FROM users;'),
    '0',
    'Refusing to mutate a previously used customer database',
  )
  assert.equal(db('SELECT COUNT(*) FROM customer_orders;'), '0')
  assert.equal(
    db('SELECT COUNT(*) FROM brands;'),
    '2',
    'Seed the approved fictional catalogue first',
  )
  assert.equal(db('SELECT COUNT(*) FROM products;'), '4')
  assert.equal(db("SELECT COUNT(*) FROM products WHERE slug NOT LIKE 'demo-m01-%';"), '0')
  const evidence: {
    backendSHA: string
    base: string
    project: string
    checks: { name: string; status: string }[]
    orders: { mode: string; id: number; total: number; statuses: number[] }[]
    outcome: string
    error?: string
    databaseOrders?: number
    limits: string[]
  } = {
    backendSHA: context.backendSHA,
    base: context.base,
    project: context.project,
    checks: [],
    orders: [],
    outcome: 'RUNNING',
    limits: [
      'Host execution of existing Expo API adapters against real Spring Boot/MySQL; no native UI/device acceptance.',
      'Synthetic records only; host memory storage does not test Keychain.',
      'Disposable COD orders remain UNPAID; no real payment.',
    ],
  }
  const output = path.join(path.dirname(contextPath), 'test-002-transactions.json')
  const pass = (name: string) => {
    evidence.checks.push({ name, status: 'PASS' })
    console.log(`PASS ${name}`)
  }
  const safeId = (value: number) => {
    assert(Number.isSafeInteger(value) && value > 0, 'Invalid server ID')
    return value
  }
  const countOrders = () => Number(db('SELECT COUNT(*) FROM customer_orders;'))
  const stocks = () =>
    new Map(
      db('SELECT id,stock_quantity FROM products ORDER BY id;')
        .split('\n')
        .map((line) => {
          const [id, stock] = line.split('\t').map(Number)
          return [id!, stock!]
        }),
    )
  const expectStatus = (operation: () => Promise<unknown>, status: number) =>
    assert.rejects(operation, (e: unknown) => e instanceof ApiError && e.status === status)
  let token: string | null = null
  let fault: 'drop' | 408 | 429 | null = null
  const statuses: number[] = []
  const transport: typeof fetch = async (input, options) => {
    const response = await fetch(input, options)
    if (
      new URL(String(input)).pathname === '/api/v1/customers/me/orders' &&
      options?.method === 'POST'
    ) {
      statuses.push(response.status)
      if (fault !== null && response.status === 201) {
        const selected = fault
        fault = null
        await response.arrayBuffer() // The real server committed before response failure is injected.
        if (selected === 'drop') throw new TypeError('Controlled post-commit response loss')
        return new Response(
          JSON.stringify({ message: 'Controlled post-commit uncertain outcome' }),
          { status: selected, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }
    return response
  }
  const request = createClient(
    context.base,
    () => token,
    (sent) => {
      if (sent === token) token = null
    },
    transport,
  )
  const api = createApi(request)
  const unique = randomUUID()
  const email = `test002-${unique}@example.invalid`,
    otherEmail = `test002-other-${unique}@example.invalid`
  const password = randomBytes(24).toString('base64url')
  const freshLogin = async () => {
    const result = await api.login(email, password)
    token = result.accessToken
    assert.equal(result.account.role, 'CUSTOMER')
    return result
  }
  try {
    const health = await fetch(`${endpoint.origin}/actuator/health/readiness`)
    assert.equal(health.status, 200)
    assert.equal(((await health.json()) as { status: string }).status, 'UP')
    pass('Real backend readiness and MySQL migrations V1-V14')
    await expectStatus(() => api.register('invalid-email', 'short'), 400)
    const customer = await api.register(email, password)
    const second = await api.register(otherEmail, password)
    safeId(customer.id)
    safeId(second.id)
    await expectStatus(() => api.register(email, password), 409)
    await expectStatus(() => api.login(email, randomBytes(24).toString('base64url')), 401)
    const login = await freshLogin()
    assert.equal(login.expiresIn, 30, 'Expiry test requires the disposable 30-second JWT profile')
    pass('Registration, duplicate/invalid registration and valid/invalid login')
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
    await expectStatus(() => api.cart(), 401)
    const restored = await sessions.restore()
    assert(restored?.accessToken === login.accessToken, 'Host-memory session restoration failed')
    token = restored!.accessToken
    await api.cart()
    const invalid = createApi(
      createClient(
        context.base,
        () => 'deliberately-invalid-test-token',
        () => {},
      ),
    )
    await expectStatus(() => invalid.cart(), 401)
    await expectStatus(() => request('/admin/products'), 403)
    pass('Missing/invalid bearer, customer role boundary and host-session restoration')
    const brands = await api.brands(),
      categories = await api.categories(),
      catalogue = await api.products({ size: 100 })
    assert.equal(brands.length, 2)
    assert.equal(categories.totalElements, 2)
    assert.equal(catalogue.totalElements, 4)
    const first = catalogue.content.find((p) => p.slug === 'demo-m01-linen-shirt')!
    const other = catalogue.content.find((p) => p.slug === 'demo-m01-canvas-tote')!
    assert(
      first && other && first.brandId !== other.brandId,
      'Approved multi-brand fixtures missing',
    )
    safeId(first.id)
    safeId(other.id)
    assert.equal((await api.product(first.slug)).id, first.id)
    assert(
      (await api.products({ brandId: first.brandId, categoryId: first.categoryId })).content.every(
        (p) => p.brandId === first.brandId,
      ),
    )
    pass('Authenticated brand/category/product discovery, filtering and slug details')
    await freshLogin()
    const addressBody = {
      recipientName: 'TEST-002 disposable customer',
      phoneNumber: '+92 300 1234567',
      addressLine1: 'Fictional QA address',
      city: 'Lahore',
      province: 'Punjab',
    }
    await expectStatus(() => api.saveAddress({ ...addressBody, recipientName: '' }), 400)
    const address = await api.saveAddress(addressBody)
    const spare = await api.saveAddress({ ...addressBody, city: 'Karachi', province: 'Sindh' })
    safeId(address.id)
    safeId(spare.id)
    await api.saveAddress({ ...addressBody, addressLine1: 'Fictional QA updated' }, address.id)
    await api.defaultAddress(spare.id)
    assert((await api.addresses()).some((a) => a.id === spare.id && a.isDefault))
    const otherLogin = await api.login(otherEmail, password)
    let otherToken: string | null = otherLogin.accessToken
    const otherApi = createApi(
      createClient(
        context.base,
        () => otherToken,
        () => {
          otherToken = null
        },
      ),
    )
    const otherAddress = await otherApi.saveAddress(addressBody)
    await expectStatus(() => api.review(otherAddress.id), 404)
    pass('Address validation/create/edit/default/retrieval and cross-customer ownership')
    let cart = await api.add(first.id, 1)
    let line = cart.items.find((i) => i.productId === first.id)!
    safeId(line.itemId)
    await expectStatus(() => api.quantity(line.itemId, 0), 400)
    await api.quantity(line.itemId, 2)
    await api.add(other.id, 1)
    cart = await api.cart()
    const temporary = cart.items.find((i) => i.productId === other.id)!
    await api.remove(temporary.itemId)
    assert.equal((await api.cart()).items.length, 1)
    await api.add(other.id, 1)
    cart = await api.cart()
    assert.equal(Math.round(cart.subtotal * 100), Math.round((first.price * 2 + other.price) * 100))
    pass('Real multi-brand cart add/update/remove, validation and server subtotal')
    const beforeFailure = stocks()
    await api.quantity(line.itemId, beforeFailure.get(first.id)! + 1)
    await expectStatus(() => api.review(address.id), 409)
    assert.equal(countOrders(), 0)
    assert.equal(stocks().get(first.id), beforeFailure.get(first.id))
    await api.quantity(line.itemId, 2)
    assert.equal((await api.config()).codEnabled, true)
    pass('Out-of-stock checkout rejects without creating an order or changing inventory')
    const orderIds: number[] = []
    const pendingStore = createPendingStore(storage, customer.id)
    for (const mode of ['drop', 408, 429] as const) {
      await freshLogin()
      if (mode !== 'drop') await api.add(first.id, 1)
      const review = await api.review(address.id)
      const pending = newPending(
        { addressId: address.id, quoteToken: review.quoteToken },
        randomUUID,
      )
      await pendingStore.save(pending)
      const countBefore = countOrders(),
        stockBefore = stocks(),
        start = statuses.length
      fault = mode
      let failure: unknown
      try {
        await api.place(pending.request, pending.key)
      } catch (e) {
        failure = e
      }
      assert(
        failure instanceof ApiError && failure.status === (mode === 'drop' ? 0 : mode),
        'Expected controlled post-commit API failure',
      )
      assert(uncertain(failure), 'TEST-001 uncertain retry protections must remain active')
      assert.equal(
        countOrders(),
        countBefore + 1,
        'Server must have committed before injected response loss',
      )
      const loaded = await createPendingStore(storage, customer.id).load()
      assert(loaded?.key === pending.key, 'Pending key must survive host adapter restart')
      const result = await api.place(loaded!.request, loaded!.key)
      safeId(result.id)
      orderIds.push(result.id)
      assert.equal(result.paymentStatus, 'UNPAID')
      assert.equal(result.status, 'PLACED')
      assert.equal(result.paymentMethod, 'COD')
      assert.equal(result.total, review.total)
      assert.equal(countOrders(), countBefore + 1, 'Retry must not create a duplicate order')
      for (const item of result.items)
        assert.equal(
          stocks().get(item.productId),
          stockBefore.get(item.productId)! - item.quantity,
          'Inventory must decrement exactly once',
        )
      assert.equal((await api.cart()).items.length, 0)
      await expectStatus(
        () => api.place({ ...pending.request, addressId: spare.id }, pending.key),
        409,
      )
      await pendingStore.clear()
      evidence.orders.push({
        mode: String(mode),
        id: result.id,
        total: result.total,
        statuses: statuses.slice(start),
      })
      pass(
        `Post-commit ${mode} injection: exact retry retrieves one COD order; one stock decrement`,
      )
    }
    await freshLogin()
    await api.add(first.id, 1)
    const review = await api.review(address.id),
      key = randomUUID(),
      countBefore = countOrders(),
      stockBefore = stocks(),
      start = statuses.length
    const requestBody = { addressId: address.id, quoteToken: review.quoteToken }
    const repeated = await Promise.all([api.place(requestBody, key), api.place(requestBody, key)])
    assert.equal(repeated[0]!.id, repeated[1]!.id)
    assert.deepEqual(statuses.slice(start).sort(), [200, 201])
    assert.equal(countOrders(), countBefore + 1)
    assert.equal(stocks().get(first.id), stockBefore.get(first.id)! - 1)
    orderIds.push(repeated[0]!.id)
    evidence.orders.push({
      mode: 'concurrent-same-key',
      id: repeated[0]!.id,
      total: repeated[0]!.total,
      statuses: statuses.slice(start),
    })
    pass('Concurrent same-key requests return 201/200, same order ID and one inventory decrement')
    assert.equal((await api.orders()).totalElements, orderIds.length)
    const historic = await api.order(String(orderIds[0]))
    await api.deleteAddress(address.id)
    assert.equal(
      (await api.order(String(orderIds[0]))).deliveryAddress.addressLine1,
      historic.deliveryAddress.addressLine1,
    )
    otherToken = (await api.login(otherEmail, password)).accessToken
    await expectStatus(() => otherApi.order(String(orderIds[0])), 404)
    assert.equal((await otherApi.orders()).totalElements, 0)
    pass('Order history/details, immutable delivery snapshot and cross-customer isolation')
    await sessions.clear()
    token = null
    await expectStatus(() => api.orders(), 401)
    await freshLogin()
    assert.equal((await api.orders()).totalElements, orderIds.length)
    pass('Client logout removes access; real re-login restores persisted customer orders')
    const expiring = await freshLogin()
    const expiredApi = createApi(
      createClient(
        context.base,
        () => expiring.accessToken,
        () => {},
      ),
    )
    const expiry =
      Number(
        JSON.parse(Buffer.from(expiring.accessToken.split('.')[1]!, 'base64url').toString()).exp,
      ) * 1000
    console.log('Waiting for actual test JWT expiry, including backend clock-skew tolerance.')
    const deadline = Date.now() + 130000
    let rejected = false
    while (Date.now() < deadline) {
      try {
        await expiredApi.cart()
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          rejected = true
          break
        }
        throw e
      }
      await delay(3000)
    }
    assert(rejected && Date.now() >= expiry, 'Actual expired test JWT must be rejected')
    pass('Real issued JWT expires and protected backend request returns 401')
    evidence.databaseOrders = countOrders()
    assert.equal(evidence.databaseOrders, 4)
    assert.equal(db("SELECT COUNT(*) FROM customer_orders WHERE payment_status <> 'UNPAID';"), '0')
    evidence.outcome = 'PASS'
  } catch (error) {
    evidence.outcome = 'FAIL'
    evidence.error =
      error instanceof ApiError
        ? `API status ${error.status}: ${error.message}`
        : error instanceof Error
          ? error.message
          : 'Unknown failure'
    throw error
  } finally {
    writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n')
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Isolated acceptance failed')
  process.exitCode = 1
})
