import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getAddresses, getCart } from './api/brandista'
import { ApiError } from './api/client'
import { useAuth } from './auth-context'
import { checkoutConfig, defaultAddress, deleteAddress, getOrder, getOrders, placeOrder, reviewCheckout, saveAddress } from './checkout-api'
import type { Address, Cart } from './types'
import type { AddressInput, CheckoutReview, CustomerOrder, Delivery, OrderPage, PendingOrder } from './checkout-types'
import './checkout.css'

const money = (value: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
const message = (cause: unknown) => cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'
function ErrorMessage({ text }: { text: string }) { return text ? <p className="inline-error" role="alert">{text}</p> : null }
export function DeliveryText({ address }: { address: Delivery }) {
  return <div className="delivery-text"><strong>{address.recipientName}</strong><span>{address.phoneNumber}</span><span>{address.addressLine1}</span>{address.addressLine2 && <span>{address.addressLine2}</span>}<span>{address.city}{address.province ? `, ${address.province}` : ''} {address.postalCode}</span>{address.deliveryInstructions && <span>Delivery instructions: {address.deliveryInstructions}</span>}</div>
}
function AddressEditor({ address, onSaved, onCancel }: { address: Address | null; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [values, setValues] = useState<AddressInput>({ recipientName: address?.recipientName || '', phoneNumber: address?.phoneNumber || '', addressLine1: address?.addressLine1 || '', addressLine2: address?.addressLine2 || '', city: address?.city || '', province: address?.province || '', postalCode: address?.postalCode || '', deliveryInstructions: address?.deliveryInstructions || '' })
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const fields = [
    ['recipientName', 'Recipient name', 120, true, 'name'], ['phoneNumber', 'Phone number', 25, true, 'tel'],
    ['addressLine1', 'Address line 1', 255, true, 'address-line1'], ['addressLine2', 'Address line 2 (optional)', 255, false, 'address-line2'],
    ['city', 'City', 100, true, 'address-level2'], ['province', 'Province / region', 100, true, 'address-level1'],
    ['postalCode', 'Postal code (optional)', 20, false, 'postal-code'],
  ] as const
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true; setBusy(true); setError(''); setFieldErrors({})
    try { await saveAddress(values, address?.id); await onSaved() }
    catch (cause) {
      setError(message(cause))
      if (cause instanceof ApiError) setFieldErrors(Object.fromEntries(cause.fieldErrors.map((field) => [field.field, field.message])))
    } finally { submitting.current = false; setBusy(false) }
  }
  return <form className="form address-form" onSubmit={(event) => void submit(event)}>
    <h2>{address ? 'Edit address' : 'Add delivery address'}</h2>
    <fieldset disabled={busy}>
      {fields.map(([name, label, max, required, autoComplete]) => <label key={name} htmlFor={`address-${name}`}>{label}
        <input id={`address-${name}`} name={name} type={name === 'phoneNumber' ? 'tel' : 'text'} autoComplete={autoComplete} maxLength={max} required={required} value={values[name] || ''} aria-invalid={Boolean(fieldErrors[name])} aria-describedby={fieldErrors[name] ? `error-${name}` : undefined} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} />
        {fieldErrors[name] && <small id={`error-${name}`} className="field-error">{fieldErrors[name]}</small>}
      </label>)}
      <label htmlFor="address-instructions">Delivery instructions (optional)<textarea id="address-instructions" maxLength={500} rows={3} value={values.deliveryInstructions} onChange={(event) => setValues((current) => ({ ...current, deliveryInstructions: event.target.value }))} /></label>
      <ErrorMessage text={error} />
      <div className="checkout-actions"><button className="button" type="submit">{busy ? 'Saving…' : 'Save address'}</button><button className="button outline" type="button" onClick={onCancel}>Cancel</button></div>
    </fieldset>
  </form>
}
export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [editing, setEditing] = useState<Address | null | undefined>()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const action = useRef(false)
  async function load() { setError(''); try { setAddresses(await getAddresses()) } catch (cause) { setError(message(cause)) } }
  useEffect(() => { void load() }, [])
  async function mutate(operation: () => Promise<unknown>, success: string) {
    if (action.current) return
    action.current = true; setBusy(true); setError(''); setNotice('')
    try { await operation(); setNotice(success); await load() } catch (cause) { setError(message(cause)) }
    finally { action.current = false; setBusy(false) }
  }
  return <section className="wrap page-space"><div className="eyebrow">Your Brandista</div><h1 className="page-title">My addresses</h1>
    <div className="checkout-actions"><Link to="/account">My account</Link><Link to="/orders">My orders</Link><Link to="/checkout">Continue to checkout</Link></div>
    <ErrorMessage text={error} />{notice && <p className="notice" role="status">{notice}</p>}
    {editing !== undefined ? <AddressEditor key={editing?.id || 'new'} address={editing} onCancel={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); setNotice('Address saved.'); await load() }} /> : <>
      <button className="button" onClick={() => { setNotice(''); setEditing(null) }} disabled={busy}>Add address</button>
      {!addresses && !error ? <p role="status">Loading your addresses…</p> : addresses?.length === 0 ? <div className="empty"><h2>No saved addresses yet</h2><p>Add a delivery address to start checkout.</p></div> : <div className="address-grid">{addresses?.map((address) => <article className="saved-address" key={address.id}>
        {address.isDefault && <p className="eyebrow">Default address</p>}<DeliveryText address={address} />
        <div className="checkout-actions"><button className="button outline small" disabled={busy} onClick={() => setEditing(address)}>Edit</button>
          {!address.isDefault && <button className="button outline small" disabled={busy} onClick={() => void mutate(() => defaultAddress(address.id), 'Default address updated.')}>Make default</button>}
          <button className="button outline small" disabled={busy} onClick={() => { if (window.confirm('Delete this saved address? Placed orders retain their delivery details.')) void mutate(() => deleteAddress(address.id), 'Address deleted.') }}>Delete</button></div>
      </article>)}</div>}
      {error && <button className="button outline" onClick={() => void load()}>Try again</button>}
    </>}
  </section>
}
function readPending(customerId: number | undefined): PendingOrder | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(`brandista:checkout:${customerId}`) || 'null')
    if (value && typeof value === 'object' && 'key' in value && 'request' in value) {
      const candidate = value as PendingOrder
      if (typeof candidate.key === 'string' && /^[a-f0-9-]{36}$/i.test(candidate.key) && Number.isSafeInteger(candidate.request?.addressId) && /^[a-f0-9]{64}$/.test(candidate.request?.quoteToken)) return candidate
    }
  } catch { /* Storage can be unavailable; an in-memory key still protects immediate retries. */ }
  return null
}
function remember(customerId: number | undefined, pending: PendingOrder | null) {
  try { const key = `brandista:checkout:${customerId}`; if (pending) sessionStorage.setItem(key, JSON.stringify(pending)); else sessionStorage.removeItem(key) } catch { /* No access tokens or personal delivery data are stored here. */ }
}
export function Checkout() {
  const { account } = useAuth()
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [review, setReview] = useState<CheckoutReview | null>(null)
  const [pending, setPending] = useState<PendingOrder | null>(() => readPending(account?.id))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  async function load() {
    setLoading(true); setError('')
    try {
      const [saved, current, config] = await Promise.all([getAddresses(), getCart(), checkoutConfig()])
      setAddresses(saved); setCart(current); setEnabled(config.codEnabled)
      setSelected(saved.find((address) => address.isDefault)?.id || saved[0]?.id || null)
    } catch (cause) { setError(message(cause)) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function prepare() {
    if (!selected || submitting.current) return
    submitting.current = true; setBusy(true); setError('')
    try { setReview(await reviewCheckout(selected)) } catch (cause) { setError(message(cause)) }
    finally { submitting.current = false; setBusy(false) }
  }
  async function submit() {
    if (submitting.current || (!pending && (!review || !selected))) return
    submitting.current = true; setBusy(true); setError('')
    const attempt = pending || { key: crypto.randomUUID(), request: { addressId: selected!, quoteToken: review!.quoteToken } }
    setPending(attempt); remember(account?.id, attempt)
    try {
      const order = await placeOrder(attempt.request, attempt.key)
      remember(account?.id, null); setPending(null)
      navigate(`/orders/${order.id}?placed=1`, { replace: true })
    } catch (cause) {
      setError(message(cause))
      // Network/server failures can have an unknown outcome: retain the exact request/key for replay.
      if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 408 && cause.status !== 429) {
        remember(account?.id, null); setPending(null); setReview(null)
      }
    } finally { submitting.current = false; setBusy(false) }
  }
  return <section className="wrap page-space"><div className="eyebrow">The final details</div><h1 className="page-title">Checkout</h1>
    <p>Cash on Delivery. No payment is collected when you place this order.</p><ErrorMessage text={error} />
    {pending && <div className="saved-address"><h2>Finish your previous submission</h2><p>The result may not have reached your browser. Retry the same submission to retrieve or place that order safely.</p><button className="button" disabled={busy} onClick={() => void submit()}>{busy ? 'Checking order…' : 'Retry submitted order'}</button><p><Link to="/orders">Check my orders</Link></p></div>}
    {loading ? <p role="status">Loading checkout…</p> : error && !cart ? <button className="button outline" onClick={() => void load()}>Try again</button> : !enabled ? <p role="status">COD checkout is not enabled in this environment.</p> : !cart?.items.length ? <div className="empty"><h2>Your cart is empty</h2><Link to="/products">Browse products</Link></div> : !addresses.length ? <div className="empty"><h2>Add a delivery address</h2><Link className="button" to="/account/addresses">Manage addresses</Link></div> : <div className="checkout-layout">
      <div><h2>Delivery address</h2><Link to="/account/addresses">Manage saved addresses</Link><fieldset className="address-options" disabled={busy || Boolean(pending) || Boolean(review)}><legend className="sr-only">Select a saved address</legend>{addresses.map((address) => <label className="saved-address address-option" key={address.id}>
        <input type="radio" name="delivery-address" value={address.id} checked={selected === address.id} onChange={() => { setSelected(address.id); setReview(null) }} aria-label={`Deliver to ${address.recipientName}, ${address.addressLine1}`} />
        <span>{address.isDefault && <span className="eyebrow">Default</span>}<DeliveryText address={address} /></span>
      </label>)}</fieldset></div>
      <div className="checkout-review"><h2>{review ? 'Review your order' : 'Cart summary'}</h2>
        {(review?.items || cart.items).map((line) => <div className="checkout-line" key={line.productId}><div><strong>{line.productName}</strong><span>{line.brandName} · Quantity {line.quantity}</span></div><b>{money(line.lineSubtotal)}</b></div>)}
        {review ? <><h3>Deliver to</h3><DeliveryText address={review.deliveryAddress} /><dl className="order-totals"><dt>Subtotal</dt><dd>{money(review.subtotal)}</dd><dt>Delivery charge</dt><dd>{money(review.deliveryCharge)}</dd><dt>Tax</dt><dd>{money(review.tax)}</dd><dt>Discount</dt><dd>{money(review.discount)}</dd><dt>Total payable on delivery</dt><dd><strong>{money(review.total)}</strong></dd></dl><p>Payment method: Cash on Delivery · Payment remains UNPAID until collection. Local MVP charges: no added delivery charge, tax or discount.</p>
          <button className="button" disabled={busy || Boolean(pending)} onClick={() => void submit()}>{busy ? 'Placing order…' : 'Place COD order'}</button><button className="button outline" disabled={busy || Boolean(pending)} onClick={() => setReview(null)}>Change delivery address</button>
        </> : <><p>Estimated subtotal: <strong>{money(cart.subtotal)}</strong></p><p>We will verify current prices, availability and stock before you confirm.</p><button className="button" disabled={busy || !selected || Boolean(pending)} onClick={() => void prepare()}>{busy ? 'Reviewing…' : 'Review order'}</button></>}
      </div>
    </div>}
    <p><Link to="/cart">Back to cart</Link> · <Link to="/orders">My orders</Link></p>
  </section>
}
function OrderSummary({ order }: { order: CustomerOrder }) {
  return <><p>Order #{order.id} · {new Date(`${order.createdAt}Z`).toLocaleString('en-PK')}</p><p><strong>{order.status}</strong> · Cash on Delivery · Payment: <strong>{order.paymentStatus}</strong></p><p>No money has been collected through this application.</p>
    <div className="checkout-layout"><div className="saved-address"><h2>Delivery details</h2><DeliveryText address={order.deliveryAddress} /></div><div className="checkout-review"><h2>Order items</h2>{order.items.map((line) => <div className="checkout-line" key={line.productId}><div><strong>{line.productName}</strong><span>{line.brandName} · {line.quantity} × {money(line.unitPrice)}</span></div><b>{money(line.lineSubtotal)}</b></div>)}<dl className="order-totals"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd><dt>Delivery</dt><dd>{money(order.deliveryCharge)}</dd><dt>Tax</dt><dd>{money(order.tax)}</dd><dt>Discount</dt><dd>{money(order.discount)}</dd><dt>Total payable on delivery</dt><dd><strong>{money(order.total)}</strong></dd></dl></div></div>
  </>
}
export function OrderDetails() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true; setOrder(null); setError('')
    getOrder(id).then((value) => { if (active) setOrder(value) }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [id, retry])
  return <section className="wrap page-space"><div className="eyebrow">Your Brandista</div><h1 className="page-title">{params.get('placed') === '1' ? 'Order confirmed' : 'Order details'}</h1><ErrorMessage text={error} />{error ? <button className="button outline" onClick={() => setRetry((value) => value + 1)}>Try again</button> : !order ? <p role="status">Loading order…</p> : <OrderSummary order={order} />}<p><Link to="/orders">My orders</Link> · <Link to="/products">Continue browsing</Link></p></section>
}
export function Orders() {
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<OrderPage | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true; setResult(null); setError('')
    getOrders(page).then((value) => { if (active) setResult(value) }).catch((cause: unknown) => { if (active) setError(message(cause)) })
    return () => { active = false }
  }, [page, retry])
  return <section className="wrap page-space"><div className="eyebrow">Your Brandista</div><h1 className="page-title">My orders</h1><ErrorMessage text={error} />{error ? <button className="button outline" onClick={() => setRetry((value) => value + 1)}>Try again</button> : !result ? <p role="status">Loading orders…</p> : !result.content.length ? <div className="empty"><h2>No orders yet</h2><Link to="/products">Browse products</Link></div> : <><div className="address-grid">{result.content.map((order) => <article className="saved-address" key={order.id}><h2>Order #{order.id}</h2><p>{order.status} · COD · {order.paymentStatus}</p><p>{money(order.total)} · {order.items.length} product lines</p><Link className="text-link" to={`/orders/${order.id}`}>View order details</Link></article>)}</div><div className="pagination"><button className="button outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>← Previous</button><span>Page {page + 1} of {result.totalPages}</span><button className="button outline" disabled={page + 1 >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Next →</button></div></>}<p><Link to="/account">My account</Link></p></section>
}
